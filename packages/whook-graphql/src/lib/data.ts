import YHTTPError from 'yhttperror';

export function deserialize<T>(data: string, name: string): Record<string, T> {
  let deserializedData: Record<string, T>;

  try {
    deserializedData = JSON.parse(data);
  } catch (err) {
    throw YHTTPError.cast(err as Error, 400, 'E_BAD_JSON', name, data);
  }

  if (typeof deserializedData !== 'object') {
    throw new YHTTPError(400, 'E_BAD_JSON', name, data);
  }
  return deserializedData;
}
