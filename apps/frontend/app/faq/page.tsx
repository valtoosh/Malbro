// apps/frontend/app/faq/page.tsx
import { PageShell, DisclosureList, LinkPrimitive, Stamp } from '@marlbro/ui';

export const metadata = { title: 'Frequently Asked Questions' };

export default function FaqPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §F">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§06 — FREQUENTLY ASKED QUESTIONS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          FREQUENTLY ASKED QUESTIONS
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          General disclosures pertaining to the Marlbro Foundation grant program. The information
          herein does not constitute financial advice, tax advice, or medical advice.
        </p>
      </header>

      <div className="max-w-[820px]">
        <DisclosureList
          items={[
            {
              question: 'What is the Marlbro Foundation?',
              answer: (
                <p>
                  The Marlbro Foundation is a discretionary grant-issuing instrument denominated in
                  $MARLBRO and SOL on the Solana blockchain. It is not affiliated with the Marlboro
                  brand, Altria Group, or Philip Morris International. The misspelling is intentional.
                </p>
              ),
            },
            {
              question: 'How does the grant program work?',
              answer: (
                <p>
                  The Foundation issues two classes of grant. The Bounty Board lists curated
                  discretionary subsidies attached to specified acts. The Open Grant is a standardized
                  application available to any qualifying applicant. All grants require documentation
                  of a transaction (a receipt) plus a corresponding post on X (formerly Twitter)
                  tagging @marlbrotoken.
                </p>
              ),
            },
            {
              question: 'Does the Foundation sell cigarettes?',
              answer: (
                <p>
                  No. The Foundation does not sell, ship, distribute, or otherwise touch tobacco
                  products. The Foundation is exclusively a grant-application portal. Applicants
                  procure cigarettes through ordinary lawful retail channels.
                </p>
              ),
            },
            {
              question: 'Who reviews the applications?',
              answer: (
                <p>
                  All applications are subject to manual review by Foundation officers pursuant to
                  Schedule R-7 §11. The Foundation reserves discretionary judgement in all matters
                  of approval, rejection, and disbursement.
                </p>
              ),
            },
            {
              question: 'How are payouts made?',
              answer: (
                <p>
                  Payouts are executed on the Solana blockchain via the Squads multisig protocol.
                  Approved grants result in an irrevocable on-chain disbursement of $MARLBRO
                  and/or SOL to the wallet address provided by the applicant.
                </p>
              ),
            },
            {
              question: 'How frequently may I apply?',
              answer: (
                <p>
                  Applications to the Open Grant lane are subject to a per-wallet and
                  per-Twitter-ID cooldown of 7 days. Lifetime caps also apply. The Bounty Board
                  permits at most 3 unresolved bounty submissions per wallet at a given time. The
                  Foundation may adjust these limits without notice.
                </p>
              ),
            },
            {
              question: 'What constitutes a fraudulent application?',
              answer: (
                <p>
                  Any application furnishing falsified documentation, duplicating a prior submission,
                  using a coordinated cluster of accounts to inflate volume, or otherwise contravening
                  Schedule R-7 §17. Fraudulent applications result in permanent disqualification of
                  the wallet and Twitter account in question.
                </p>
              ),
            },
            {
              question: 'Is the $MARLBRO token an investment?',
              answer: (
                <p>
                  No. $MARLBRO is a meme token. It carries no expectation of return, no claim on
                  Foundation assets, no governance rights, and no representations of future value.
                  See Schedule R-7 §4 (NOT FINANCIAL ADVICE).
                </p>
              ),
            },
            {
              question: 'Where can I view the on-chain disbursements?',
              answer: (
                <p>
                  Each approved grant appears on the{' '}
                  <LinkPrimitive href="/wall">Wall of Grants</LinkPrimitive>, which is updated upon
                  successful execution of the on-chain transaction. The transaction signature is
                  recorded with each disbursement for independent verification.
                </p>
              ),
            },
            {
              question: 'Does the Foundation endorse smoking?',
              answer: (
                <p>
                  No. The Foundation does not endorse, recommend, encourage, or advocate for the
                  consumption of tobacco or nicotine in any form. References to the Marlboro Red
                  are aesthetic and referential, not promotional. Smoking remains a leading cause
                  of preventable death.
                </p>
              ),
            },
            {
              question: 'What if I sent the grant to the wrong wallet address?',
              answer: (
                <p>
                  The Foundation cannot recover funds sent to incorrectly-furnished wallet addresses.
                  All applications require the applicant to confirm the correctness of the address
                  prior to submission. The Foundation strongly recommends double-verification before
                  filing Form 042-A or Form 042-B.
                </p>
              ),
            },
            {
              question: 'How do I contact the Foundation?',
              answer: (
                <p>
                  The Foundation does not maintain a public contact address. The Foundation may be
                  observed conducting business on X via{' '}
                  <LinkPrimitive href="https://twitter.com/marlbrotoken">@marlbrotoken</LinkPrimitive>.
                  The Foundation does not engage in private direct messages regarding grant status;
                  all communications are conducted via the application portal.
                </p>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-16 flex items-center gap-6 flex-wrap">
        <Stamp label="NOT FINANCIAL ADVICE" rotate={-7} />
        <Stamp label="NOT TAX ADVICE" rotate={4} variant="ink" />
        <Stamp label="NOT MEDICAL ADVICE" rotate={-12} />
      </div>
    </PageShell>
  );
}
