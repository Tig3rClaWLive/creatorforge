'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CreatorProfile() {
  const params = useParams();
  const [creator, setCreator] = useState<any>(null);

  useEffect(() => {
    fetch('/api/creators')
      .then(r => r.json())
      .then(j => {
        const match = (j.creators || []).find(
          (x:any) =>
            x.display_name?.toLowerCase() ===
            String(params.name).toLowerCase()
        );

        setCreator(match);
      });
  }, [params]);

  if (!creator) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">
          Creator nicht gefunden
        </h1>
      </section>
    );
  }

  return (
    <section>

      {creator.banner_url && (
        <img
          src={creator.banner_url}
          className="h-[350px] w-full object-cover"
          alt="Banner"
        />
      )}

      <div className="container py-12">

        <div className="flex flex-col items-center text-center">

          {creator.avatar_url && (
            <img
              src={creator.avatar_url}
              className="-mt-24 h-40 w-40 rounded-full border-4 border-zinc-950 object-cover"
              alt="Avatar"
            />
          )}

          <h1 className="mt-6 text-6xl font-black">
            {creator.display_name}
          </h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            {creator.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            {creator.twitch && (
              <a href={creator.twitch} target="_blank" className="btn btn-primary">
                Twitch
              </a>
            )}

            {creator.youtube && (
              <a href={creator.youtube} target="_blank" className="btn btn-soft">
                YouTube
              </a>
            )}

            {creator.tiktok && (
              <a href={creator.tiktok} target="_blank" className="btn btn-soft">
                TikTok
              </a>
            )}

            {creator.discord && (
              <a href={creator.discord} target="_blank" className="btn btn-soft">
                Discord
              </a>
            )}
          </div>

          <div className="mt-8 text-lg text-orange-300">
            {creator.uploads_count} freigegebene Uploads
          </div>

        </div>

      </div>

    </section>
  );
}