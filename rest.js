
ko.pontillo = function () { };

ko.pontillo.rest = function () { };

ko.pontillo.rest.utils = new function () {
    var self = this;
    // Sets an entity from a JSON string
    self.setFromJSON = function (object, JSON) {
        self.setFromJS(object, ko.mapping.fromJSON(JSON));
    };
    // Sets an entity from a regular JS object
    self.setFromJS = function (object, JS) {
        // Set the new data
        var d = ko.mapping.fromJS(JS);
        // Set as observable
        if (object === undefined)
            object = ko.observable();
        // Makes every object into an observable
        if (!ko.isObservable(d)) d = ko.observable(d);
        ko.pontillo.rest.utils.makeAllObservables(d);
        object(ko.isObservable(d) ? d() : d);
    };
    // Serializes an object to a JSON string
    self.toJSON = function (object) {
        return ko.mapping.toJSON(object);
    };
    // Makes an observable's children observables on every level
    self.makeAllObservables = function (observable) {
        // Loop through its children
        for (var child in observable()) {
            // If this child is not an observable and is an object
            if ((!ko.isObservable(observable()[child])) && (typeof observable()[child] === "object")) {
                // Make it an observable
                observable()[child] = ko.observable(observable()[child]);
                // Make all of its children observables
                self.makeAllObservables(observable()[child]);
            }
        }
    };
}

ko.pontillo.rest.entity = function (dataModel) {
    // The main object
    var self = this;
    var newDataModel = dataModel;
    // Setting what to ignore
    ko.mapping.defaultOptions().ignore = ["isUpdating", "isLoaded", "isGot", "isError", "__ko_mapping__"];

    var item = ko.observable(ko.mapping.fromJS({}));

    // A few status observables
    item.isUpdating = ko.observable(false);
    item.isLoaded = ko.observable(false);
    item.isGot = ko.observable(false);
    item.isError = ko.observable(false);

    item.newEntity = function () {
        // Set the new data
        data = newDataModel || {};
        item.setData(data);
        item.isLoaded(false);
    };

    // A method for attaching a metadata object to any object
    item.setTracker = function (object) {
        // Create the metadata
        var tracker = {};
        tracker.parent = object;
        tracker.oldValue = ko.mapping.toJSON(object);
        tracker.newValue = ko.mapping.toJSON(object);
        tracker.changed = true;
        
		// Attach the metadata to the object

        object._tracker = tracker;
        
		// TODO: does not work, if nothing changes the hasChanged computed is not fired off

        tracker.clean = function () {
            var me = object._tracker;
            me.changed = false;
            me.hasChanged(false);
        };
        // Checks for changing in the model
        tracker.checkChanged = function () {
            var me = object._tracker;
            this.newValue = ko.mapping.toJSON(object);
            var res = ((this.newValue != this.oldValue) && (this.oldValue != undefined) && this.changed);
            if (res == true) this.changed == true;
            return res;
        };
        // Computed Observable, returns the value of checkChanged and tracks all the changes in the entity
        tracker.hasChanged = new ko.computed({
            read: function () {
                var me = object._tracker;
                console.log("Something has changed");
                return me.checkChanged();
            },
            write: function (value) {
                return value;
            },
            owner: object
        }, object);
        // Undoes all the changes in the model
        tracker.undo = function () {
            var me = object._tracker;
            if (me.newValue != me.oldValue) {
                me.newValue = me.oldValue;
                ko.pontillo.rest.utils.setFromJSON(object, me.oldValue);
            }
        };
        // Add a couple of utility functions to the observable object
        object.hasChanged = new ko.computed(function () {
            return object._tracker.checkChanged();
        });
        object.undo = function () {
            return object._tracker.undo();
        };

        console.log(tracker);
    };

    item.setData = function (data) {
        ko.pontillo.rest.utils.setFromJS(item, data);
        item.setTracker(item);
        item.isLoaded(true);
    };

    item.toJSON = function () {
        return ko.pontillo.rest.utils.toJSON(item);
    };

    // The GET method, reads an element from an URL and updates the model
    item.Get = function (url, callback, conType) {
        return $.ajax({
            type: 'GET',
            url: url,		    
			contentType: conType,

            dataType: "json",
	        data: item.toJSON(),

			user: "mobila",
			password: "z754Z71zLoss",  
			xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,
            beforeSend: function () {
                item.isUpdating(true);
                console.log("Getting resource at " + url + " ...");
            },
            statusCode: {
                200: function (data, textStatus, jqXHR) {
                    // Update the data
					if (callback) callback(jqXHR);

                    item.setData(data);
                    item.isGot(true);
                    item.isError(false);
                    console.log("Got the resource at " + url + " .");
                    if (callback) callback();
                },
				200: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
                304: function () {
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                item.isError(true);
                console.log("Error while getting the resource at " + url + " .");
            }
        });/*.always(function () {
       	    item.isUpdating(false);
        });*/
    };

    // The POST method, adds an element to an URL and updates the model
    item.Post = function (url, callback, conType) {

alert(item.toJSON());
        return $.ajax({
            type: "POST",
            url: url,
            contentType: conType,

            dataType: "json",
	        data: item.toJSON(),

			user: "mobila",
			password: "z754Z71zLoss",  
			xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,

		    beforeSend: function (xhr) {

				item.isUpdating(true);
                console.log("Posting resource at " + url + " ...");
            },			
            statusCode: {
                201: function (data, textStatus, jqXHR) {
                    // Update the data
					if (callback) callback(jqXHR);

					item.setData(data);
                    item.isGot(true);
                    item.isError(false);
                    console.log("Posted the resource at " + url + " .");                    
                },
				200: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
                304: function () {
                }				
            },
            error: function (jqXHR, textStatus, errorThrown) {
                item.isError(true);
                console.log("Error while posting the resource at " + url + " .");
            }
        });/*.always(function (data, textstatus, b) {

			//if (callback) callback(data);

       	    item.isUpdating(false);
        });*/
    };

    // The PUT method, updates an element to an URL and updates the model
    item.Put = function (url, callback, conType) {
		
        return $.ajax({
            type: "PUT",
            url: url,
			Accept: conType,
            contentType: conType,
            
			dataType: "json",
	        data: item.toJSON(),

			user: "mobila",
			password: "z754Z71zLoss",  
			xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,

            beforeSend: function () {
                item.isUpdating(true);
                console.log("Putting resource at " + url + " ...");
            },				
            statusCode: {
                201: function (data, textStatus, jqXHR) {
                    // Update the data
					if (callback) callback(jqXHR);

                    item.setData(data);
                    item.isGot(true);
                    item.isError(false);
                    console.log("Put the resource at " + url + " .");                    
                },
				200: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
                304: function () {
                },

				204: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
            },
            error: function (jqXHR, textStatus, errorThrown) {
                item.isError(true);
                console.log("Error while putting the resource at " + url + " .");
            }
        });/*.always(function () {
       	    item.isUpdating(false);
        });*/
    };

    // The DELETE method, deletes an element from an URL
    item.Delete = function (url, callback, conType) {

        return $.ajax({
            type: "DELETE",
            url: url,

			Accept: conType,
            contentType: conType,
            
			dataType: "json",
	        //data: item.toJSON(),

			user: "mobila",
			password: "z754Z71zLoss",  
			xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,

            beforeSend: function () {
                item.isUpdating(true);
                console.log("Deleting resource at " + url + " ...");
            },
/*            success: function (data, textStatus, jqXHR) {
                // Update the data
                if (callback) callback();

				item.setData(data);
                item.isGot(true);
                item.isError(false);
                console.log("Deleted the resource at " + url + " .");
                
            },*/
			 statusCode: {
                201: function (data, textStatus, jqXHR) {
                    // Update the data
					if (callback) callback(jqXHR);

                    item.setData(data);
                    item.isGot(true);
                    item.isError(false);
                    console.log("Put the resource at " + url + " .");                    
                },
				200: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
                304: function () {
                },

				204: function(data, textStatus, b) {
		
					if (callback) callback(data);
		       	    item.isUpdating(false);
				},
            },
            error: function (jqXHR, textStatus, errorThrown) {
                item.isError(true);
                console.log("Error while deleting the resource at " + url + " .");
            }
        })/*.always(function () {
       	    item.isUpdating(false);
        })*/;
    };


    /* ---------------------------------------------------------------------------------- */

    return item;
};
