import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, FolderOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";

export default async function PastasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const folders = await db.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true } } },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Minhas Pastas</h1>
          <p className="text-sm text-muted-foreground">Organize suas transcrições em pastas por processo ou cliente.</p>
        </div>
        <CreateFolderDialog />
      </div>

      {folders.length === 0 ? (
        <Card className="items-center gap-3 px-6 py-16 text-center">
          <Folder className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhuma pasta ainda</p>
            <p className="text-sm text-muted-foreground">Crie uma pasta pra começar a organizar seus vídeos.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {folders.map((f) => (
            <Link key={f.id} href={`/pastas/${f.id}`}>
              <Card className="gap-3 p-6 transition-colors hover:bg-secondary/40">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                  <FolderOpen className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="truncate font-medium text-foreground">{f.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {f._count.videos} vídeo{f._count.videos === 1 ? "" : "s"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
