import fs from "fs";
import csv from "csv-parser";

const sales = [];
const customers = {};
const orders = {};

fs.createReadStream("data/raw/customers.csv")
  .pipe(csv())
  .on("data", (row) => {
    customers[row.customer_id] = row;
  })
  .on("end", () => {
    console.log("Customers loaded");
    loadOrders();
  });

function loadOrders() {
  const ordersData = JSON.parse(
    fs.readFileSync("data/raw/orders.json", "utf-8")
  );

  ordersData.forEach((o) => {
    orders[o.order_id] = o.status;
  });

  console.log("Orders loaded");
  loadSales();
}

function loadSales() {
  fs.createReadStream("data/raw/sales.csv")
    .pipe(csv())
    .on("data", (row) => {
      sales.push(row);
    })
    .on("end", () => {
      console.log("Sales loaded");
      transformData();
    });
}


function transformData() {
  const finalData = sales.map((sale) => {
    const customer = customers[sale.customer_id];
    const status = orders[sale.order_id];

    const yearMonth = sale.date.slice(0, 7);
    const pricePerTon =
      Number(sale.revenue_usd) / Number(sale.volume_ton);

    return {
      ...sale,
      customer_name: customer?.name,
      country: customer?.country,
      region: customer?.region,
      status: status,
      year_month: yearMonth,
      price_per_ton: pricePerTon.toFixed(2),
    };
  });

  saveCSV(finalData);
}

function saveCSV(data) {
  const headers = Object.keys(data[0]).join(",");

  const rows = data.map((row) =>
    Object.values(row).join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  fs.writeFileSync("data/processed/final_dataset.csv", csvContent);

  console.log("ETL completed. File saved in /data/processed/");
}