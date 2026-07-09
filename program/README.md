# LaunchPad Smart Contract (Anchor)

Your own bonding-curve program — you control fees, graduation, and all on-chain logic.

## Install tools (one time)

```bash
# Install Rust: https://rustup.rs
# Install Solana CLI: https://docs.solanalabs.com/cli/install
# Install Anchor: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

## Deploy to devnet

```bash
cd program
anchor build
anchor deploy --provider.cluster devnet
```

## Update platform config

After deploy, set `programId` in `config/platform.json` to your deployed program ID.

## What the program handles

- `initialize` — set global config (fees, fee recipient)
- `create` — mint new token + bonding curve account
- `buy` / `sell` — constant-product bonding curve trades
- `graduate` — migrate liquidity to Raydium when market cap threshold hit

The frontend SDK in `src/lib/bonding-curve.ts` mirrors this math for simulation until you wire on-chain calls.
