interface FuzzyOptions {
	pre?: string;
	post?: string;
	caseSensitive?: boolean;
	extract?: (item: any) => string;
}

interface FuzzyMatch {
	rendered: string;
	score: number;
}

interface FuzzyResult<T = any> {
	string: string;
	score: number;
	index: number;
	original: T;
}

export function fuzzySimpleFilter(pattern: string, array: string[]): string[] {
	return array.filter((str) => fuzzyTest(pattern, str));
}

export function fuzzyTest(pattern: string, str: string): boolean {
	return fuzzyMatch(pattern, str) !== null;
}

export function fuzzyMatch(pattern: string, str: string, opts: FuzzyOptions = {}): FuzzyMatch | null {
	let patternIdx = 0;
	const result: string[] = [];
	const len = str.length;
	let totalScore = 0;
	let currScore = 0;

	const pre = opts.pre ?? "";

	const post = opts.post ?? "";

	const compareString = opts.caseSensitive ? str : str.toLowerCase();

	pattern = opts.caseSensitive ? pattern : pattern.toLowerCase();

	for (let idx = 0; idx < len; idx++) {
		let ch = str[idx];
		if (compareString[idx] === pattern[patternIdx]) {
			ch = pre + ch + post;
			patternIdx += 1;

			currScore += 1 + currScore;
		} else {
			currScore = 0;
		}
		totalScore += currScore;
		result.push(ch);
	}

	if (patternIdx === pattern.length) {
		totalScore = compareString === pattern ? Infinity : totalScore;
		return { rendered: result.join(""), score: totalScore };
	}

	return null;
}

export function fuzzyFilter<T = string>(pattern: string, arr: T[], opts: FuzzyOptions = {}): FuzzyResult<T>[] {
	if (!arr || arr.length === 0) {
		return [];
	}
	if (typeof pattern !== "string") {
		return arr.map((original, index) => ({
			string: opts.extract ? opts.extract(original) : String(original),
			score: 0,
			index,
			original,
		}));
	}

	return arr
		.reduce<FuzzyResult<T>[]>((prev, element, idx) => {
			let str = String(element);
			if (opts.extract) {
				str = opts.extract(element);
			}
			const rendered = fuzzyMatch(pattern, str, opts);
			if (rendered != null) {
				prev.push({
					string: rendered.rendered,
					score: rendered.score,
					index: idx,
					original: element,
				});
			}
			return prev;
		}, [])

		.sort((a, b) => {
			const compare = b.score - a.score;
			if (compare) return compare;
			return a.index - b.index;
		});
}
