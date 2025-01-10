export function serializeToFormData<T>(data: T): FormData {
  if (data instanceof FormData) {
    return data;
  }
  const formData = new FormData();
  if (isObject(data)) {
    serializeData(data, [], formData);
  }
  return formData;
}

type ArrayPathEntry = {
  type: "array",
  index: number;
  delimiter: boolean
}
type ObjectPathEntry = {
  type: "object",
  key: string;
  delimiter: boolean
}


type PathEntry = ArrayPathEntry | ObjectPathEntry;

function serializeData<T extends object>(data: T, path: PathEntry[], formData: FormData) {
  if (isArray(data)) {
    serializeArray(data, path, formData);
    return;
  }

  if (isObject(data)) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      const newPath = [...path, { type: "object", key, delimiter: shouldHaveDelimiter(value) } as const];
      serializeData(value, newPath, formData);
    }
    return;
  }
  if (shouldAddData(data)) {
    formData.append(constructPath(path), serializePrimitive(data));
  }
}

function serializeArray<T extends object>(entries: T[], path: PathEntry[], formData: FormData) {
  entries.forEach((value, index) => {
    const newPath = [...path, { type: "array", index, delimiter: shouldHaveDelimiter(value) } as const];
    serializeData(value, newPath, formData);
  });
}


function isArray<T extends object>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is object {
  return !isArray(value) && typeof value === "object" && value !== null;
}

function shouldAddData<T extends object>(data: T) {
  return typeof data !== "function" && !!data;
}


/**
 * Check if an object should have a delimiter (dot) in the path
 */
function shouldHaveDelimiter<T extends object>(childEntry: T) {
  return isObject(childEntry) && Object.keys(childEntry).length >= 1;
}

function constructPath(elements: PathEntry[]): string {
  return elements.map((element) => {
    if (element.type === "array") {
      return `[${element.index}]${element.delimiter ? "." : ""}`;
    }
    return `${element.key}${element.delimiter ? "." : ""}`;
  }).join("");
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "boolean") {
    return value ? "on" : "";
  }
  return String(value);
}