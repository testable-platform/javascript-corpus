v = (some_var, taint) => {
  // ruleid: issue_112_b
  return `Text before escaped backtick, \`Between backticks\` ${some_var == true} other text \`other text inside backticks\` ${taint} \`more text inside backticks\``
}

