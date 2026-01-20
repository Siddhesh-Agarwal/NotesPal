import DodoPayments, { type ClientOptions } from "dodopayments";

export const dodoPaymentsEnv: NonNullable<ClientOptions["environment"]> = "test_mode";
export const DodoPaymentsClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: dodoPaymentsEnv,
});
