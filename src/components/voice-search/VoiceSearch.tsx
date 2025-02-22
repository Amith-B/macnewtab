import { ReactComponent as MicIcon } from "./mic.svg";
import "./VoiceSearch.css";

export default function VoiceSearch({ animate }: { animate: boolean }) {
  return (
    <div className={"blobs blob-palette" + (animate ? " animate" : "")}>
      <svg viewBox="0 0 1100 1100">
        <g className="blob blob-1">
          <path />
        </g>
        <g className="blob blob-2">
          <path />
        </g>
        <g className="blob blob-3">
          <path />
        </g>
        <g className="blob blob-4">
          <path />
        </g>
        <g className="blob blob-1 alt">
          <path />
        </g>
        <g className="blob blob-2 alt">
          <path />
        </g>
        <g className="blob blob-3 alt">
          <path />
        </g>
        <g className="blob blob-4 alt">
          <path />
        </g>
      </svg>
      <MicIcon className="mic-icon" />
    </div>
  );
}
