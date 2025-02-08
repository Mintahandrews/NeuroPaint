"use client";
import Spinner from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [userAPIKey, setUserAPIKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const debouncedPrompt = useDebounce(prompt, 300);
  const [generations, setGenerations] = useState<
    {
      prompt: string;
      image: ImageResponse;
    }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt],
    queryFn: async () => {
      let res = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, userAPIKey, iterativeMode }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || errorData.message || "An error occurred"
        );
      }

      return (await res.json()) as ImageResponse;
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => {
        const newGenerations = [...images, { prompt, image }];
        if (newGenerations.length > 10) {
          newGenerations.shift();
        }
        return newGenerations;
      });
      setActiveIndex(generations.length);
    }
  }, [generations, image, prompt]);

  useEffect(() => {
    return () => {
      setGenerations([]);
      setActiveIndex(undefined);
    };
  }, []);

  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;
  return (
    <div className="flex h-full flex-col px-5">
      <header className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 backdrop-blur-sm bg-black/30 dark:bg-black/30 bg-white/30 rounded-xl mb-8 shadow-lg">
        <div className="mb-4 md:mb-0">
          <h1 className="font-bold text-5xl bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
            NeuroPaint
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-200 font-medium">
              [Optional] Add your
              <a
                href="https://api.together.xyz/settings/api-keys"
                target="_blank"
                className="ml-1 font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-cyan-300 transition-all duration-300"
              >
                Together API Key
              </a>
            </label>
            <Input
              placeholder="API Key"
              type="password"
              value={userAPIKey}
              onChange={(e) => setUserAPIKey(e.target.value)}
              className="mt-2 w-full md:w-64 bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500 transition-all duration-300"
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex justify-center">
        <form className="mt-6 w-full max-w-2xl">
          <fieldset className="group">
            <div className="relative transform transition-all duration-300 hover:scale-[1.01]">
              <Textarea
                rows={4}
                spellCheck={false}
                placeholder="Describe your image..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full resize-none rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-lg backdrop-blur-sm transition-all duration-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50"
              />
              <div className="absolute right-4 top-4">
                {(isFetching || isDebouncing) && (
                  <Spinner className="size-5 text-violet-500" />
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end space-x-4">
              <label
                title="Use earlier images as references"
                className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
              >
                Consistency mode
                <Switch
                  checked={iterativeMode}
                  onCheckedChange={setIterativeMode}
                  className="data-[state=checked]:bg-violet-500"
                />
              </label>
            </div>
          </fieldset>
        </form>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        {!activeImage || !prompt ? (
          <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-200 md:text-3xl lg:text-4xl">
              Generate images in real time
            </p>
            <p className="mt-4 text-balance text-sm text-gray-600 dark:text-gray-300 md:text-base lg:text-lg">
              Enter a prompt and generate images in milliseconds as you keep on
              typing.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex w-full max-w-4xl flex-col justify-center">
            <div>
              <Image
                width={1024}
                height={768}
                src={`data:image/png;base64,${activeImage.b64_json}`}
                alt=""
                className={`${
                  isFetching ? "animate-pulse" : ""
                } max-w-full rounded-lg object-cover shadow-sm shadow-black`}
              />
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `data:image/png;base64,${activeImage.b64_json}`;
                  link.download = `NeuroPaint-${Date.now()}.png`;
                  link.click();
                }}
                className="mt-4 flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
              >
                <Download className="size-4" />
                Download Image
              </button>
            </div>

            <div className="mt-4 flex gap-4 overflow-x-scroll pb-4">
              {generations.map((generatedImage, i) => (
                <button
                  key={i}
                  className="w-32 shrink-0 opacity-50 hover:opacity-100"
                  onClick={() => setActiveIndex(i)}
                >
                  <Image
                    width={1024}
                    height={768}
                    src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                    alt=""
                    className={`${
                      isFetching ? "animate-pulse" : ""
                    } max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
