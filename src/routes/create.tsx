import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createPublicClient, createWalletClient, custom, parseEther, http } from "viem";
import { mainnet } from "viem/chains";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FACTORY } from "@/lib/iland/constants";
import { factoryAbi, tokenAbi } from "@/lib/iland/abis";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "iLAND — launch" }] }),
  component: Create,
});

const publicClient = createPublicClient({ chain: mainnet, transport: http() });

function Create() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function launch() {
    const cleanName = name.trim();
    const cleanSymbol = symbol.trim().toUpperCase();
    if (cleanName.length < 2) return setStatus("Name too short");
    if (!/^[A-Z]{1,8}$/.test(cleanSymbol)) return setStatus("Symbol must be 1-8 letters");

    const eth = (window as any).ethereum;
    if (!eth) return setStatus("No wallet found");

    setLoading(true);
    setStatus("Connecting wallet…");
    setTxHash("");
    setTokenAddress("");

    try {
      const [account] = await eth.request({ method: "eth_requestAccounts" });
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: custom(eth),
      });

      setStatus("Sending launch transaction…");
      const hash = await walletClient.writeContract({
        address: FACTORY as `0x${string}`,
        abi: factoryAbi,
        functionName: "launch",
        args: [cleanName, cleanSymbol],
      });
      setTxHash(hash);
      setStatus("Waiting for confirmation…");

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Launch failed");

      // Parse Launched event
      const log = receipt.logs.find((l) => l.address.toLowerCase() === FACTORY.toLowerCase());
      let token = "";
      if (log) {
        // topic1 = token (indexed)
        token = "0x" + log.topics[1]?.slice(-40);
        setTokenAddress(token);
      }

      setStatus("Launch confirmed. Opening pool…");

      if (token) {
        const openHash = await walletClient.writeContract({
          address: token as `0x${string}`,
          abi: tokenAbi,
          functionName: "open",
        });
        setStatus("Waiting for open()…");
        await publicClient.waitForTransactionReceipt({ hash: openHash });
        setStatus("Done! Token is live at fixed MCAP.");
      } else {
        setStatus("Launch done. Call open() on the token manually.");
      }
    } catch (e: any) {
      setStatus(e?.shortMessage || e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <p className="text-sm font-medium text-muted">Launch</p>
      <h1 className="mt-2 font-display text-title">Launch a token</h1>
      <p className="mt-1 text-sm text-muted">
        Factory: <a href={`https://etherscan.io/address/${FACTORY}`} target="_blank" className="text-accent">{FACTORY.slice(0,6)}…{FACTORY.slice(-4)}</a>
        · Fixed MCAP · Same method as GRINTA
      </p>

      <div className="mt-8 grid max-w-md gap-4">
        <Input placeholder="Token name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="SYMBOL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={8} />
        <Button onClick={launch} disabled={loading}>
          {loading ? "Launching…" : "Launch + Open Pool"}
        </Button>
        {status && <p className="text-sm text-muted">{status}</p>}
        {txHash && (
          <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" className="text-sm text-accent">
            Launch tx
          </a>
        )}
        {tokenAddress && (
          <div className="text-sm">
            Token: <a href={`https://etherscan.io/address/${tokenAddress}`} target="_blank" className="text-accent">{tokenAddress}</a>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
