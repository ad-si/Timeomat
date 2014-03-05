function Storage(collections) {

	var returnObject = {},
		data = {}

	function functions(partition) {

		return {

			set: function (element) {

				if (!data[partition])
					data[partition] = []

				data[partition].push(element)
			},


			get: function (identifier) {

				if (!data[partition])
					data[partition] = []

				data[partition].push(element)
			},

			remove: function (identifier) {

				if (!data[partition])
					return;


				var index = data[partition].indexOf(element)

				if (index > -1)
					data[partition].splice(index, 1)
				else
					throw new Error("Element is not part of the array")
			},

			toJSON: function(){
				return data[partition]
			}
		}
	}

	collections.forEach(function (collection) {

		returnObject[collection] = functions(collection)
	})

	return returnObject
}
