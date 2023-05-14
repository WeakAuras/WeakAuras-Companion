const bbcode = (str) => {
  let output = str || "";

  output = output.replace(/\[(?:[\w]+)(?:=[\w\d.,\\/"'#,-]*)*?(?: *[\w\d]+=.+)*?\](?:.*?)\[\/\1\]|\[\[/gi, "$2");
  return output;
};

const markdown = (str) => {
  // https://github.com/stiang/remove-markdown/blob/master/index.js
  let output = str || "";

  output = output
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove setext-style headers
    .replace(/^[=-]{2,}\s*$/g, "")
    // Remove footnotes?
    .replace(/\[\^.+?\](: .*?$)?/g, "")
    .replace(/\s{0,2}\[.*?\]: .*?$/g, "")
    // Remove images
    .replace(/!\[(.*?)\][[(].*?[\])]/g, "")
    // Remove inline links
    .replace(/\[(.*?)\][[(].*?[\])]/g, "$1")
    // Remove blockquotes
    .replace(/^\s{0,3}>\s?/g, "")
    // Remove reference-style links?
    .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "")
    // Remove atx-style headers
    .replace(/^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm, "$1$2$3")
    // Remove emphasis (repeat the line to remove double emphasis)
    .replace(/([*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
    .replace(/([*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
    // Remove code blocks
    .replace(/(`{3,})(.*?)\1/gm, "$2")
    // Remove inline code
    .replace(/`(.+?)`/g, "$1")
    // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
    .replace(/\n{2,}/g, "\n\n")
    .replace(/\[\[/g, "\\[[");
  return output;
};

export default { bbcode, markdown };
