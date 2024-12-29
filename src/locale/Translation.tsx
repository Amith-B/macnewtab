import { memo, useContext } from "react";
import { AppContext } from "../context/provider";
import { translation } from "./languages";

export default memo(function Translation({
  value,
}: {
  value: keyof (typeof translation)["en"];
}) {
  const { locale } = useContext(AppContext);

  const text = translation[locale]?.[value];

  return <>{text || value}</>;
});
