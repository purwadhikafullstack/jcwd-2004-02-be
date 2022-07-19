module.exports.DateConverter = (date) => {
  let convertedDate = new Date(date);
  let month = convertedDate.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  let tanggal = convertedDate.getDate();
  let year = convertedDate.getFullYear();
  return `${year}${month}${tanggal}`;
};
