/*
 * Runs synchronously before first paint (extension pages can't use inline
 * scripts). It paints the saved theme colour immediately so the tab never
 * flashes white/black, and exposes helpers to dismiss the boot skeleton.
 * Keep this file tiny and dependency-free.
 */
(function () {
  var BG = {
    light: "#efefee",
    dark: "#2e2d2c",
    blue: "#c9e0ff",
    red: "#ffe0e0",
    orange: "#ffd9c7",
    purple: "#ebeaff",
    pink: "#ffeaf3",
    brown: "#fff3ea",
    teal: "#dff8f6",
    mint: "#edfbe3",
    gold: "#fff4d8",
    rose: "#fff0eb",
  };
  var DARK = { dark: 1 };

  function read(key, spaceId) {
    try {
      var k = spaceId && spaceId !== "Default" ? "space_" + spaceId + "__" + key : key;
      // no fallback to the Default space: the app uses its own default too
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }

  var spaceId = "Default";
  try {
    var cfg = JSON.parse(localStorage.getItem("macnewtab_spaces_config") || "null");
    if (cfg && cfg.activeSpaceId) spaceId = cfg.activeSpaceId;
  } catch (e) {}

  var color = read("theme_color", spaceId);
  var theme = read("default_theme", spaceId) || "system";
  var key = color && BG[color] ? color : theme;
  if (key === "system" || !BG[key]) {
    key =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }

  // Blurred wallpaper: only for an image wallpaper (the app's default type).
  // The thumbnail is written by src/utils/bootCache.ts.
  var thumb = null;
  var wpType = read("wallpaper_type", spaceId);
  if (!wpType || wpType === "image") {
    try {
      var cache = JSON.parse(localStorage.getItem("boot_cache") || "{}");
      var entry = cache && cache[spaceId];
      if (entry && typeof entry.thumb === "string" && entry.thumb.indexOf("data:image/") === 0) {
        thumb = entry.thumb;
      }
    } catch (e) {}
  }

  var root = document.documentElement;
  root.style.backgroundColor = BG[key];
  root.style.setProperty("--bs-bg", BG[key]);
  root.style.colorScheme = DARK[key] ? "dark" : "light";
  if (DARK[key]) root.setAttribute("data-boot-dark", "");
  if (thumb) {
    root.style.setProperty("--bs-img", 'url("' + thumb + '")');
    root.setAttribute("data-boot-img", "");
  }

  // --- skeleton dismissal -------------------------------------------------
  var rootReady = false;
  var wallpaperReady = false;
  var dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    var el = document.getElementById("boot-skeleton");
    if (!el) return;
    // Reveal the live page through an expanding transparent circle.
    // Animate a registered length on the lightweight skeleton overlay rather
    // than clipping the wallpaper/widget layers underneath it.
    if (document.documentElement.hasAttribute("data-boot-iris")) {
      var gone = function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
      // The mask lives on this class (see public/index.html); without it the
      // animated radius has nothing to drive and the skeleton just pops out.
      el.classList.add("boot-skeleton--iris");
      var radius = Math.ceil(Math.sqrt(
        window.innerWidth * window.innerWidth +
        window.innerHeight * window.innerHeight
      ));
      try {
        var anim = el.animate(
          [
            { "--iris-radius": "0px" },
            { "--iris-radius": radius + "px" }
          ],
          {
            duration: 650,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
            fill: "forwards"
          }
        );
        anim.onfinish = gone;
        anim.oncancel = gone;
      } catch (e) {
        gone();
      }
      setTimeout(gone, 900);
      return;
    }
    el.classList.add("boot-skeleton--out");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 130);
  }
  function maybeDismiss() {
    if (rootReady && wallpaperReady) {
      // wait two frames so the app has actually painted underneath
      requestAnimationFrame(function () {
        requestAnimationFrame(dismiss);
      });
    }
  }

  window.__bootSkeleton = {
    appMounted: function () {
      rootReady = true;
      maybeDismiss();
    },
    wallpaperReady: function () {
      wallpaperReady = true;
      maybeDismiss();
    },
  };
  // Safety net: never leave the skeleton up if something stalls. The app only
  // mounts once the tab is first visible (see useHasBeenVisible), so the timer
  // starts then too; otherwise a background tab would fire it before mounting.
  function armSafetyNet() {
    setTimeout(dismiss, 2500);
  }
  if (document.visibilityState === "visible") {
    armSafetyNet();
  } else {
    document.addEventListener("visibilitychange", function onVisible() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      armSafetyNet();
    });
  }
})();
