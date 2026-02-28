import { memo, useEffect, useState } from "react";
import { fetchImageFromIndexedDB } from "../../utils/db";

const SITE_IMAGE_URL = "https://favicone.com/";

interface DockIconProps {
  id: string;
  hasCustomIcon?: boolean;
  url: string;
  title: string;
  iconDbPrefix?: string;
}

export const DockIcon = memo(
  ({
    id,
    hasCustomIcon,
    url,
    title,
    iconDbPrefix = "dock_icon",
  }: DockIconProps) => {
    const [iconSrc, setIconSrc] = useState<string>("");

    useEffect(() => {
      let isMounted = true;

      const loadIcon = async () => {
        let src = "";

        if (hasCustomIcon) {
          try {
            const blobUrl = await fetchImageFromIndexedDB(
              `${iconDbPrefix}_${id}`,
            );
            if (blobUrl) {
              src = blobUrl;
            }
          } catch (error) {
            console.error("Failed to load custom icon", error);
          }
        }

        if (!src && url) {
          try {
            let hostname = "";
            try {
              hostname = new URL(url).hostname;
            } catch {
              if (!/^https?:\/\//i.test(url)) {
                try {
                  hostname = new URL("https://" + url).hostname;
                } catch {}
              }
            }
            if (hostname) {
              src = `${SITE_IMAGE_URL}${hostname}?s=32`;
            }
          } catch {}
        }

        if (isMounted && src) {
          setIconSrc(src);
        }
      };

      loadIcon();

      return () => {
        isMounted = false;
      };
    }, [id, hasCustomIcon, url, iconDbPrefix]);

    // Fallback if no src found yet, or valid
    // We can render a placeholder or just empty
    if (!iconSrc) return null;

    return <img className="dock-site__icon" src={iconSrc} alt={title} />;
  },
);
