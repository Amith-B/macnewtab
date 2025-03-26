export default function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--theme-link-clr)",
            textDecoration: "underline",
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
