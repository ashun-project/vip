<template>
	<view class="uni-list">
		<slot />
	</view>
</template>
<script>
	export default {
		name: 'UniList'
	}
</script>
<style>
	@charset "UTF-8";

	.uni-list {
		background-color: rgba(255, 255, 255, 0);
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		min-height: 90upx;
	}

	.uni-list:after {
		position: absolute;
		z-index: 10;
		right: 0;
		bottom: 0;
		left: 0;
		height: 1px;
		content: '';
		-webkit-transform: scaleY(.5);
		transform: scaleY(.5);
		background-color: #e2e2e2
	}

	.uni-list:before {
		position: absolute;
		z-index: 10;
		right: 0;
		top: 0;
		left: 0;
		height: 1px;
		content: '';
		-webkit-transform: scaleY(.5);
		transform: scaleY(.5);
		background-color: #e2e2e2
	}
</style>