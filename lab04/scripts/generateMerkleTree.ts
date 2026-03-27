import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "node:fs";

const membersData = JSON.parse(fs.readFileSync("./members.json", "utf-8"));
const members: string[] = membersData.addresses;

const values = members.map(addr => [addr]);
export const tree = StandardMerkleTree.of(values, ["address"]);
export const root = tree.root;