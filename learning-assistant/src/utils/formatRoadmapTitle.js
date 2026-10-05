const titleCaseAcronyms = [
  [/\bCi\/Cd\b/gi, 'CI/CD'],
  [/\bDevops\b/gi, 'DevOps'],
  [/\bJvm\b/gi, 'JVM'],
  [/\bSql\b/gi, 'SQL'],
  [/\bHtml5?\b/gi, (match) => match.toUpperCase()],
  [/\bCss\b/gi, 'CSS'],
  [/\bApi\b/gi, 'API'],
  [/\bAws\b/gi, 'AWS'],
  [/\bIbm\b/gi, 'IBM'],
  [/\bDsa\b/gi, 'DSA'],
  [/\bJavaScript\b/gi, 'JavaScript'],
  [/\bTypescript\b/gi, 'TypeScript'],
  [/\bGithub\b/gi, 'GitHub'],
  [/\bOpenshift\b/gi, 'OpenShift'],
];

export const formatRoadmapTitle = (title) => {
  if (title !== title.toLocaleUpperCase()) return title;
  const titleCase = title.toLocaleLowerCase().replace(/(^|[\s/&-])([a-z])/g, (_, separator, letter) =>
    `${separator}${letter.toUpperCase()}`
  );
  return titleCaseAcronyms.reduce(
    (formatted, [pattern, replacement]) => formatted.replace(pattern, replacement),
    titleCase
  );
};
