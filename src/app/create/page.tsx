import { AppShell } from "@/components/layout/AppShell";
import { CreateCoinForm } from "@/components/create/CreateCoinForm";
import { getConfig } from "@/lib/store";

export default function CreatePage() {
  const config = getConfig();

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-center text-2xl font-bold text-white">
          Create new coin
        </h1>
        <p className="mb-8 text-center text-sm text-[#666]">
          Choose carefully, these can&apos;t be changed once the coin is created
        </p>
        <CreateCoinForm creationFeeSol={config.fees.creationFeeSol} />
      </div>
    </AppShell>
  );
}
