
const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
	/**
	* @description:
	* @return {*}
	*/
	async init() {

	}
	/**
	* @description:
	* @return {*}
	*/
	async request() {
	}

	/**
	* @description:
	* @return {*}
	*/
	async draw() {
	}


	async refresh() {

	}
	// update (dt) {}

	onLoad(): void {
		//this.test1()
		this.findMax();
	}


	//找出一个数组中第二大的数
	findMax() {
		function findSecondLargest(arr: number[]): number {
			if (arr.length < 2) {
				throw new Error("数组长度必须大于等于2");
			}

			let firstMax = arr[0];//先取第一个元素作为最得知
			let secondMax = -Infinity;

			for (let i = 1; i < arr.length; i++) {
				if (arr[i] > firstMax) {
					secondMax = firstMax;
					firstMax = arr[i];
				} else if (arr[i] > secondMax && arr[i] !== firstMax) {
					secondMax = arr[i];
				}
			}

			return secondMax;
		}

		// 示例用法
		const array = [3, 1, 4, 6, 8, 2, 7]; //从字面上看能看到7 是该数组第二大的元素

		// 这个题目如何分析？
		//首先它让你找出数组中第二大的元素，不用想肯定要用到循环
		//因为油循环，所以肯定有个临时的变量，一直被重复修改，定义一个临时变量
		//如果说只要找最大的元素，一个for走到底就可以了，如果是要找第二大的元素，关键信息，这个第二大怎么去考虑？
		//我能想到的就是。第二大 说明他除了比最大的要小，比剩下所有的都大
		//比如我定义一个已查找过的index

		// function find(arr) {
		// 	let target = 0;
		// 	let closeIndex = [];

		// 	let index = 0;

		// 	while (index < arr.length) {
		// 		if (arr[index] > target) {
		// 			target = arr[index];  //如果当前目标大于之前存储的值，就把当前目标赋值给之前存储的值

		// 			let nexIndex = index + 1;
		// 			if (arr[nexIndex] > target) {  //然后判断当前元素的下个元素是否大于 存储的值
		// 				target = arr[nexIndex];
		// 			}

		// 			closeIndex.push(nexIndex)   //无论下个元素是否大于 都把这个index存入，就表示下个索引我们已经查找过了

		// 			index = nexIndex + 1;

		// 		}
		// 	}

		// 	return target;  //这样写最后还是找出的最大的数
		// }

		//为什么上面那么写没有作用？ 其实只定义一个数据是没有用的
		//

		function find(arr) {
			let firstMax = arr[0];
			let secMax = Number.MAX_VALUE;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i] > firstMax) {
					secMax = firstMax;
					firstMax = arr[i];

				}
			}

			return secMax;
		}



		cc.warn(find(array))


		const secondLargest = findSecondLargest(array);
		console.log("第二大的数是:", secondLargest); // 输出 7

	}


	//合并两个无序数组，使得合并之后数据仍然是有序的  要求一次循环
	testMerge(a1, a2) {
		//1.定义要返回的数组
		let arr = [];
		let i = 0;
		let j = 0;

		while (i < a1.length || j < a2.length) { // 表示两个数组都没有被遍历完的情况
			if (a1[i] < a2[j]) { //如果当前遍历到的数组1的元素 小于数组2的元素，那我就把数组1的元素推进数组 并且数组1的索引++
				arr.push(a1[i]);
				i++
			} else if (a1[i] > a2[j]) {// 如果当前遍历到的数组1的元素 大于数组2的元素，那我就把数组2的元素推进数组，冰并将数组2的索引++
				arr.push(a2[j])
				j++
			} else { //如果当前遍历到的元素之间不成比较关系，那就直接推进数组，并将两个数组的索引++
				if (a1[i]) arr.push(a1[i]);
				i++
				if (a2[j]) arr.push(a2[j]);
				j++
			}
		}
		return arr;
	}




	//从数组中找到最长的子数组
	//比如给的数组时 [2, 2, 1, 4, 4, 4, 5, 5, 6, 7];  
	//可以看到满足条件的最长子数组 时 [ 4 4 4 5 5] 这个字串数组长度最长，但是只包含两个不同数字，分别是 4 和 5 
	test1() {
		function longestSubarray(nums: number[]): number[] {
			let maxLength: number = 0;
			let start: number = 0;
			let end: number = 0;
			let uniqueCount: number = 0;
			let longestSubarray: number[] = [];
			const numCounts: { [key: number]: number } = {};

			while (end < nums.length) {

				const num: number = nums[end];
				if (!(num in numCounts) || numCounts[num] === 0) {
					uniqueCount++;
				}
				numCounts[num] = (numCounts[num] || 0) + 1;

				while (uniqueCount > 2) {
					const leftNum: number = nums[start];
					numCounts[leftNum]--;
					if (numCounts[leftNum] === 0) {
						uniqueCount--;
					}
					start++;
				}

				if (end - start + 1 > maxLength) {
					maxLength = end - start + 1;
					longestSubarray = nums.slice(start, end + 1);
				}
				end++;
			}

			return longestSubarray;
		}

		const nums: number[] = [2, 2, 1, 4, 4, 4, 5, 5, 6, 7];
		console.log(longestSubarray(nums)); // Output: [4, 4, 4, 5]


	}
}
