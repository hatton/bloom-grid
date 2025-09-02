export type CellContentType = {
  id: string;
  englishName: string;
  templateHtml: string;
  regexToIdentify: RegExp;
  // Path to an icon representing this content type (SVG or image)
  icon: string;
};
