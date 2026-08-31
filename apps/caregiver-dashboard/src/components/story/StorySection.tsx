import { useEffect, useRef, useState, type ReactNode } from "react";

type StorySectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

export function StorySection({ id, children, className = "", dark = false }: StorySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.22 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`story-section min-h-screen snap-start px-6 py-20 md:px-16 ${
        dark ? "bg-deep-hill text-rice-white" : "bg-rice-white text-deep-hill"
      } ${visible ? "story-visible" : "story-hidden"} ${className}`}
    >
      <div className="mx-auto max-w-3xl">{children}</div>
    </section>
  );
}
