import { createDashboardApp } from "./dashboard";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = createDashboardApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Dashboard API server running on port ${port}`);
});
