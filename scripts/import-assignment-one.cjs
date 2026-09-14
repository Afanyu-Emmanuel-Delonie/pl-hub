const { loadEnvConfig } = require("@next/env");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc } = require("firebase/firestore");

loadEnvConfig(process.cwd());

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const assignment = {
  id: "assignment-1-sunrise-supermarket-2026",
  title: "PLSQL Assignment One - Sunrise Supermarket",
  instructions: [
    "Include a README.md with your name, Student ID, a short summary of what you did, and how to run it.",
    "Name your repository assignment_1_your_name-your_id.",
    "Push the repository by the deadline.",
    "You may use Oracle, PostgreSQL, MySQL, SQL Server, or another SQL/DBMS tool; state which one you used in the README.",
    "README must include the business scenario, every JOIN/CTE/window-function query with explanations, results or screenshots, a business interpretation, and challenges/resolutions.",
  ],
  content: [
    {
      id: "scenario",
      type: "text",
      value: "Sunrise Supermarket sells products to customers, who place orders containing one or more items. Management wants to understand who their customers are, what they buy, and how sales are trending over time. Populate the tables with at least 5 customers, 8 products across at least 3 categories, 15 orders, and 25 order items across multiple dates.",
    },
    {
      id: "schema",
      type: "code",
      language: "SQL",
      value: `CREATE TABLE customers (
  customer_id NUMBER PRIMARY KEY,
  customer_name VARCHAR2(100),
  email VARCHAR2(100),
  city VARCHAR2(50)
);

CREATE TABLE products (
  product_id NUMBER PRIMARY KEY,
  product_name VARCHAR2(100),
  category VARCHAR2(50),
  price NUMBER(10,2)
);

CREATE TABLE orders (
  order_id NUMBER PRIMARY KEY,
  customer_id NUMBER REFERENCES customers(customer_id),
  order_date DATE
);

CREATE TABLE order_items (
  order_item_id NUMBER PRIMARY KEY,
  order_id NUMBER REFERENCES orders(order_id),
  product_id NUMBER REFERENCES products(product_id),
  quantity NUMBER
);`,
    },
    {
      id: "joins",
      type: "question",
      text: "JOIN queries",
      subQuestions: [
        "List every order with the customer's name, city, and order date (INNER JOIN: orders + customers).",
        "List every order item with product name, category, price, and quantity (JOIN: order_items + products).",
        "List all customers and their orders where they exist, including customers with no orders (LEFT JOIN: customers + orders).",
      ],
    },
    {
      id: "cte",
      type: "question",
      text: "CTE query",
      subQuestions: ["Calculate each customer's total spend (quantity x price) and return customers above average spend. Use a CTE to compute customer totals first."],
    },
    {
      id: "windows",
      type: "question",
      text: "Window-function queries",
      subQuestions: [
        "Rank customers by total amount spent, highest first.",
        "Number each customer's orders in the order placed.",
        "Show a running total of revenue over time, ordered by order date.",
        "For each customer with more than one order, show days between the current and previous order.",
      ],
    },
  ],
  deadlines: [
    { groups: ["Group B", "Group C", "Group I"], deadline: "2026-09-21T23:59:00+02:00" },
    { groups: ["Group D"], deadline: "2026-09-23T23:59:00+02:00" },
  ],
  maxScore: 20,
  closedGroups: [],
  createdAt: "2026-09-14T15:00:00+02:00",
  source: "Ass I - windows_function - CTE - JOIN Sept 2026.pdf",
};

async function main() {
  const db = getFirestore(app);
  const ref = doc(db, "assignments", assignment.id);
  if ((await getDoc(ref)).exists()) {
    throw new Error("Assignment already exists; refusing to overwrite it.");
  }
  await setDoc(ref, assignment);
  console.log(`CREATED ${assignment.id}`);
}

main().catch((error) => {
  console.error(error.code ?? error.name, error.message);
  process.exitCode = 1;
});
