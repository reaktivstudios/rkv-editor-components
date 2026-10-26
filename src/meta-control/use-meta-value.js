/**
 * WordPress dependencies
 */
import { useCallback } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { useEntityProp } from "@wordpress/core-data";

/**
 * Reads and writes one post meta value, as an unsaved edit that's saved with
 * the post.
 *
 * Inside the post editor it works on the post being edited. Elsewhere, pass
 * `postType` and `postId`. The meta key has to be registered with
 * `show_in_rest`, or the value is never loaded and doesn't save.
 *
 * @param {string}        metaKey            The meta key.
 * @param {Object}        options
 * @param {string}        options.postType   Post type of the record. Defaults to the post being edited.
 * @param {number|string} options.postId     ID of the record. Defaults to the post being edited.
 * @return {Array} `[value, setValue]`, where `value` is undefined until the meta loads.
 */
const useMetaValue = (metaKey, { postType, postId } = {}) => {
	const currentPostType = useSelect(
		(select) => select("core/editor")?.getCurrentPostType(),
		[],
	);

	const [meta, setMeta] = useEntityProp(
		"postType",
		postType || currentPostType,
		"meta",
		postId,
	);

	const setValue = useCallback(
		(value) => setMeta({ ...meta, [metaKey]: value }),
		[meta, metaKey, setMeta],
	);

	return [meta?.[metaKey], setValue];
};

export default useMetaValue;
