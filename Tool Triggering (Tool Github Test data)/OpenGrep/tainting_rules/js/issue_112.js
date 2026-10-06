v = (taint) => {
  // ruleid: issue_112
  return `Text before escaped backtick, \`Between backticks\` 
     ${taint}`
}
