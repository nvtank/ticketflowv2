export function csvRow(cells: readonly string[]): string {
  return (
    cells
      .map((value) => {
        const unsafe = /^[\t\r\n]/u.test(value) || /^[=+\-@＝＋－＠]/u.test(value.trimStart());
        const text = unsafe ? "'" + value : value;
        return '"' + text.replaceAll('"', '""') + '"';
      })
      .join(',') + '\r\n'
  );
}
