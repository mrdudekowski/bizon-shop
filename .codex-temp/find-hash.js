const { execSync } = require("child_process");
const out = execSync('rg -n "pbkdf2|generatePassword|createHash" node_modules/payload/dist -g "*.js" -g "!*.map"', {
  encoding: "utf8",
  cwd: process.cwd(),
  maxBuffer: 10 * 1024 * 1024,
});
console.log(out.slice(0, 4000));
