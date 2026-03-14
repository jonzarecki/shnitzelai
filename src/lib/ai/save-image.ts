import fs from "node:fs";
import path from "node:path";
import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

const GENERATED_DIR =
	process.env.GENERATED_DIR ??
	path.join(process.cwd(), "public", "generated");

export function saveImage(imageBuffer: Buffer): string {
	if (!fs.existsSync(GENERATED_DIR)) {
		fs.mkdirSync(GENERATED_DIR, { recursive: true });
	}

	const id = ulid();
	const filename = `${id}.png`;
	const filePath = path.join(GENERATED_DIR, filename);

	fs.writeFileSync(filePath, imageBuffer);

	return `/generated/${filename}`;
}
