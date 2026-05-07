// lib/squads/propose.ts
// PLACEHOLDER: real Squads multisig integration is fill-in-later. When
// SQUADS_PROPOSER_SK + SQUADS_MULTISIG_PUBKEY env vars are absent, this
// returns a fake proposal pubkey and logs the would-be transaction so the
// admin flow runs end-to-end. Plan 7 replaces with real @sqds/multisig calls.

export interface ProposePayoutInput {
  grantId: string;
  recipientWallet: string;
  payoutMarlbro: string;  // stringified numeric
  payoutSol: string;
  memo: string;
}

export interface ProposeResult {
  ok: boolean;
  proposalPubkey: string;
  delivered: 'real' | 'stub';
}

export async function proposePayout(input: ProposePayoutInput): Promise<ProposeResult> {
  if (process.env.SQUADS_PROPOSER_SK && process.env.SQUADS_MULTISIG_PUBKEY) {
    // TODO: real implementation
    // 1. Decode SQUADS_PROPOSER_SK as a Solana keypair (base58 or array).
    // 2. Build SPL transfer ix for $MARLBRO mint + lamport transfer for SOL.
    // 3. Wrap in Squads VaultTransactionCreate ix with the memo.
    // 4. Sign with proposer keypair, send via Helius RPC.
    // 5. Return real proposal pubkey.
    throw new Error('Real Squads payout not yet implemented — Plan 7.');
  }

  // Stub: log + return fake pubkey
  const fakePubkey = `stub_proposal_${input.grantId.slice(0, 8)}_${Date.now()}`;
  console.log(
    `\n[Squads STUB] Would propose payout for grant ${input.grantId}:\n` +
      `  recipient:   ${input.recipientWallet}\n` +
      `  $MARLBRO:    ${input.payoutMarlbro}\n` +
      `  SOL:         ${input.payoutSol}\n` +
      `  memo:        ${input.memo}\n` +
      `  proposalKey: ${fakePubkey}\n` +
      `  (Set SQUADS_PROPOSER_SK + SQUADS_MULTISIG_PUBKEY to broadcast for real)\n`,
  );
  return { ok: true, proposalPubkey: fakePubkey, delivered: 'stub' };
}
