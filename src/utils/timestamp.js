module.exports = () => {
  const now = new Date().toJSON();
  const [date, time] = now.split("T");
  const [year, month, day] = date.split("-").map((v) => v.length > 2 ? v.slice(2) : v);
  const [hour, minute, others] = time.split(":");
  const [seconds, milliseconds] = others.split(".").map((v) => (v.includes("Z") ? v.replace("Z", "") : v));
  return `${"".concat(year, month, day)}-${"".concat(hour, minute, seconds)}.${milliseconds}`;
};
