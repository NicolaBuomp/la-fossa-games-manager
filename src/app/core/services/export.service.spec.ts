import { ExportService } from "./export.service";

describe("ExportService", () => {
  let service: ExportService;
  let downloaded: { filename: string; contents: string };

  beforeEach(() => {
    service = new ExportService();
    downloaded = { filename: "", contents: "" };
    spyOn(service as unknown as { download: (filename: string, contents: string) => void }, "download").and.callFake(
      (filename, contents) => {
        downloaded = { filename, contents };
      },
    );
  });

  it("exports escaped CSV rows", () => {
    service.downloadCsv("report.csv", [
      {
        name: 'Squadra "A"',
        notes: "prima, seconda",
        empty: null,
      },
    ]);

    expect(downloaded.filename).toBe("report.csv");
    expect(downloaded.contents).toBe(
      'name,notes,empty\n"Squadra ""A""","prima, seconda",""',
    );
  });

  it("downloads an empty file when there are no rows", () => {
    service.downloadCsv("empty.csv", []);

    expect(downloaded).toEqual({ filename: "empty.csv", contents: "" });
  });
});
