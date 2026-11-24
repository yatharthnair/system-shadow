// Quest periods use the device's local time. Pin tests to a zone with daylight saving time so
// date-boundary and DST tests are deterministic on every machine and CI runner.
// Runs as Jest `globalSetup` (in the parent process, before test workers start) so the
// workers inherit it — setting TZ inside a test file is too late to take effect.
module.exports = async function setTestTimezone() {
  process.env.TZ = 'America/New_York';
};
