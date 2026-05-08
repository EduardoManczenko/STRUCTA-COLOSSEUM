export const config = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://rzzzwsmkysjlrazpohpa.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enp3c21reXNqbHJhenBvaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODQwOTgsImV4cCI6MjA5Mjk2MDA5OH0.IdEs5BleVXfLGBfzuyGPQcqAPSoMAQZhTNtyjkWPWzs",
  solanaNetwork:
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as
      | "mainnet-beta"
      | "devnet"
      | "testnet") ?? "devnet",
  solanaRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  structaProgramId:
    process.env.NEXT_PUBLIC_STRUCTA_PROGRAM_ID ??
    "2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf",
  usdcMint:
    process.env.NEXT_PUBLIC_USDC_MINT ??
    "GvbqaaMC2Ptb1jvaYbNCsiS1hmmXs8vhUDQTUKzdfDbn",
  authorityWallet:
    process.env.NEXT_PUBLIC_STRUCTA_AUTHORITY ??
    "4BK7fX3FHoTozGgxTST5Ki4KGUb6GpN3vM29vgx1p1FW",
};
