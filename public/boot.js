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
    // Iris Reveal: the skeleton opens a growing hole onto the (untouched) page
    // instead of fading. The app sets data-boot-iris when that animation is on.
    if (document.documentElement.hasAttribute("data-boot-iris")) {
      var gone = function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
      // A geometric clip-path hole (even-odd) is far cheaper to paint than an
      // animated full-screen mask, and it interpolates between circle radii.
      var w = window.innerWidth, h = window.innerHeight;
      var cx = w / 2, cy = h / 2;
      var full = Math.sqrt(cx * cx + cy * cy) + 2; // half-diagonal: hole covers the screen
      var hole = function (r) {
        return (
          'path(evenodd, "M0 0H' + w + "V" + h + "H0Z" +
          "M" + (cx - r) + " " + cy +
          "A" + r + " " + r + " 0 1 0 " + (cx + r) + " " + cy +
          "A" + r + " " + r + " 0 1 0 " + (cx - r) + " " + cy + 'Z")'
        );
      };
      el.classList.add("boot-skeleton--iris");
      try {
        var anim = el.animate([{ clipPath: hole(0.5) }, { clipPath: hole(full) }], {
          duration: 600,
          easing: "ease-out",
          fill: "forwards",
        });
        anim.onfinish = gone;
      } catch (e) {
        gone();
      }
      setTimeout(gone, 900); // safety net if the animation never finishes
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
