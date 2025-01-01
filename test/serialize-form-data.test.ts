import { describe, it, expect } from "vitest";
import { serializeToFormData } from "../src/utils/serialize-to-form-data.js";

describe("serializeToFormData", () => {
  it("should return normal formData", () => {
    const formData = new FormData();
    formData.set("test", "data");
    const result = serializeToFormData(formData);
    expect(result).toBe(formData);
  });
  it("should serialize an array", () => {
    const testObject = {
      testIds: ["1", "2", "3"]
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("testIds[0]")).toBe("1");
    expect(result.get("testIds[1]")).toBe("2");
    expect(result.get("testIds[2]")).toBe("3");
  });
  it("should serialize an object", () => {
    const testObject = {
      street: "1234 Main St",
      city: "Springfield",
      state: "IL",
      country: {
        name: "United States",
        code: "US"
      }
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("street")).toBe("1234 Main St");
    expect(result.get("city")).toBe("Springfield");
    expect(result.get("state")).toBe("IL");
    expect(result.get("country.name")).toBe("United States");
    expect(result.get("country.code")).toBe("US");
  });

  it("should serialize an object with a nested array", () => {
    const testObject = {
      street: "1234 Main St",
      city: {
        details: {
          name: "Springfield",
          zip: "62701"
        },
        country: {
          name: "United States",
          code: "US"
        }
      },
      codes: [{
        code: "A",
        description: "Code A"
      }, {
        code: "B",
        description: "Code B"
      }],
      entries: {
        title: "Entries",
        items: [{
          name: "Item 1",
          value: "1"
        }, {
          name: "Item 2",
          value: "2"
        }]
      }
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);

    expect(result.get("city.details.name")).toBe("Springfield");
    expect(result.get("city.details.zip")).toBe("62701");
    expect(result.get("city.country.name")).toBe("United States");
    expect(result.get("city.country.code")).toBe("US");

    expect(result.get("street")).toBe("1234 Main St");
    expect(result.get("codes[0].code")).toBe("A");
    expect(result.get("codes[0].description")).toBe("Code A");
    expect(result.get("codes[1].code")).toBe("B");
    expect(result.get("codes[1].description")).toBe("Code B");
    expect(result.get("entries.title")).toBe("Entries");
    expect(result.get("entries.items[0].name")).toBe("Item 1");
    expect(result.get("entries.items[0].value")).toBe("1");
    expect(result.get("entries.items[1].name")).toBe("Item 2");
    expect(result.get("entries.items[1].value")).toBe("2");
  });
  it("should serialize null and undefind values", () => {
    const testObject = {
      street: null,
      city: undefined,
      state: "IL",
      country: {
        name: "United States",
        code: "US"
      }
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("street")).toBe(null);
    expect(result.get("state")).toBe("IL");
    expect(result.get("country.name")).toBe("United States");
    expect(result.get("country.code")).toBe("US");
  });

  it("should handle an empty object", () => {
    const testObject = {};
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.entries().next().done).toBe(true);
  });

  it("should handle an empty array", () => {
    const testObject = { items: [] };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.entries().next().done).toBe(true);
  });

  it("should handle mixed types", () => {
    const testObject = {
      string: "test",
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("string")).toBe("test");
    expect(result.get("number")).toBe("123");
    expect(result.get("boolean")).toBe("true");
    expect(result.get("nullValue")).toBe(null);
    expect(result.get("undefinedValue")).toBe(null);
  });

  it("should handle deeply nested objects", () => {
    const testObject = {
      level1: {
        level2: {
          level3: {
            level4: "deepValue"
          }
        }
      }
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("level1.level2.level3.level4")).toBe("deepValue");
  });

  it("should handle special characters in keys", () => {
    const testObject = {
      "special!@#$%^&*()_+-=[]{}|;':,.<>?": "value"
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("special!@#$%^&*()_+-=[]{}|;':,.<>?")).toBe("value");
  });

  it("should handle an array of objects", () => {
    const testObject = {
      items: [
        { name: "Item 1", value: "1" },
        { name: "Item 2", value: "2" }
      ]
    };
    const result = serializeToFormData(testObject);
    expect(result).toBeInstanceOf(FormData);
    expect(result.get("items[0].name")).toBe("Item 1");
    expect(result.get("items[0].value")).toBe("1");
    expect(result.get("items[1].name")).toBe("Item 2");
    expect(result.get("items[1].value")).toBe("2");
  });


});