import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function VideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const videos = await db.video.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Seus vídeos</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm underline">
            Sair
          </button>
        </form>
      </div>

      <Link
        href="/videos/new"
        className="w-fit rounded bg-black px-3 py-2 text-sm text-white"
      >
        Novo vídeo
      </Link>

      {videos.length === 0 ? (
        <p className="text-zinc-600">Nenhum vídeo enviado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {videos.map((video) => (
            <li key={video.id}>
              <Link
                href={`/videos/${video.id}`}
                className="flex items-center justify-between rounded border px-3 py-2 hover:bg-zinc-50"
              >
                <span>{video.title}</span>
                <span className="text-xs text-zinc-500">{video.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
