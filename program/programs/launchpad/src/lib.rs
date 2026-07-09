use anchor_lang::prelude::*;

declare_id!("LAUNCHPAD111111111111111111111111111111111");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        let global = &mut ctx.accounts.global;
        global.authority = ctx.accounts.authority.key();
        global.fee_bps = fee_bps;
        global.fee_recipient = ctx.accounts.fee_recipient.key();
        Ok(())
    }

    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        curve.mint = ctx.accounts.mint.key();
        curve.creator = ctx.accounts.creator.key();
        curve.virtual_sol_reserves = 30_000_000_000; // 30 SOL in lamports
        curve.virtual_token_reserves = 1_073_000_000_000_000;
        curve.real_sol_reserves = 0;
        curve.real_token_reserves = 793_100_000_000_000;
        curve.complete = false;
        curve.name = name;
        curve.symbol = symbol;
        curve.uri = uri;
        Ok(())
    }

    pub fn buy(ctx: Context<Trade>, sol_amount: u64) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        require!(!curve.complete, LaunchpadError::AlreadyGraduated);

        let fee = sol_amount
            .checked_mul(curve.fee_bps as u64)
            .unwrap()
            .checked_div(10_000)
            .unwrap();
        let sol_after_fee = sol_amount.checked_sub(fee).unwrap();

        let tokens_out = (curve.virtual_token_reserves as u128)
            .checked_mul(sol_after_fee as u128)
            .unwrap()
            .checked_div(
                (curve.virtual_sol_reserves as u128)
                    .checked_add(sol_after_fee as u128)
                    .unwrap(),
            )
            .unwrap() as u64;

        curve.virtual_sol_reserves = curve
            .virtual_sol_reserves
            .checked_add(sol_after_fee)
            .unwrap();
        curve.virtual_token_reserves = curve
            .virtual_token_reserves
            .checked_sub(tokens_out)
            .unwrap();
        curve.real_sol_reserves = curve.real_sol_reserves.checked_add(sol_amount).unwrap();
        curve.real_token_reserves = curve
            .real_token_reserves
            .checked_sub(tokens_out)
            .unwrap();

        Ok(())
    }

    pub fn sell(ctx: Context<Trade>, token_amount: u64) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        require!(!curve.complete, LaunchpadError::AlreadyGraduated);

        let sol_out = (curve.virtual_sol_reserves as u128)
            .checked_mul(token_amount as u128)
            .unwrap()
            .checked_div(
                (curve.virtual_token_reserves as u128)
                    .checked_add(token_amount as u128)
                    .unwrap(),
            )
            .unwrap() as u64;

        let fee = sol_out
            .checked_mul(curve.fee_bps as u64)
            .unwrap()
            .checked_div(10_000)
            .unwrap();

        curve.virtual_sol_reserves = curve.virtual_sol_reserves.checked_sub(sol_out).unwrap();
        curve.virtual_token_reserves = curve
            .virtual_token_reserves
            .checked_add(token_amount)
            .unwrap();
        curve.real_sol_reserves = curve
            .real_sol_reserves
            .checked_sub(sol_out.checked_sub(fee).unwrap())
            .unwrap();
        curve.real_token_reserves = curve
            .real_token_reserves
            .checked_add(token_amount)
            .unwrap();

        Ok(())
    }
}

#[account]
pub struct Global {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub fee_recipient: Pubkey,
}

#[account]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub complete: bool,
    pub fee_bps: u16,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 2 + 32)]
    pub global: Account<'info, Global>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: fee recipient wallet
    pub fee_recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(init, payer = creator, space = 8 + 32 + 32 + 8 * 4 + 1 + 2 + 4 + 32 + 4 + 10 + 4 + 200)]
    pub bonding_curve: Account<'info, BondingCurve>,
    pub mint: Signer<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut)]
    pub bonding_curve: Account<'info, BondingCurve>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[error_code]
pub enum LaunchpadError {
    #[msg("Token has already graduated")]
    AlreadyGraduated,
}
