// ==UserScript==
// @name     Moodle form simplification experience
// @description This script will strip out everything apart from required fields from view, but will allow the user to fully customise what is hidden and what is visible.
// @version  1.2
// @include  http://*/course/edit.php*
// @match    https://*/course/edit.php*
// @include  http://*/course/modedit.php*
// @match    https://*/course/modedit.php*
// @author   Adrian Greeve
// ==/UserScript==

var courseEnhancer = {

    courseformdata: [],

    init: function() {
        this.buildData();
        // window.console.log(this.courseformdata);
        this.addButton();
    },

    buildData: function() {
        let mainarea = document.querySelector("#region-main");
        let data = mainarea.querySelector("form");
        let formdata = data.querySelectorAll("fieldset.collapsible");


        for (let item of formdata) {
            let itemid = item.getAttribute("id");
            // Get the title.
            let titleraw = item.querySelector("h3");
            let title = titleraw.textContent.trim();

            // New function to add category items?
            let categoryitems = this.buildCItems(item);

            this.courseformdata.push({
                id : itemid,
                title: title,
                citems: categoryitems
            });

            let supertemp = localStorage.getItem(itemid);

            if (itemid !== "id_general" && supertemp !== "open") {
                item.classList.add('d-none');
            }
            if (itemid == "id_general" || supertemp == "open") {

                for (let citem of categoryitems) {
                    let itemdata = document.getElementById(citem.id);
                    let citemstatus = localStorage.getItem(citem.id);
                    if (this.isFieldRequired(itemdata) == false && citemstatus !== "open") {
                        itemdata.classList.add('d-none');
                    }
                    // Custom rules.
                    if (citem.id == "fitem_id_category" && citemstatus !== "open") {
                        itemdata.classList.add('d-none');
                    }
                }
                
            }
        }
    },

    buildCItems: function(category) {
        let citems = category.getElementsByClassName("fitem");
        let categoryid = category.getAttribute("id");
        let itemarray = [];
        for (let citem of citems) {
            if (!citem.hasAttribute('id')) {
                continue;

            }

            let temp = citem.firstElementChild.firstElementChild;
            if (temp == null) {
                continue;
            }
            let itemdata = {
                id: citem.getAttribute("id"),
                title: temp.textContent.trim()
            };
            itemarray.push(itemdata);
        }
        return itemarray.reverse();

    },

    isFieldRequired: function(field) {
        let item = field.querySelector("div.text-danger");
        if (item == null) {
            return false;
        }
        if (item.hasAttribute("title") && item.getAttribute("title") == "Required") {
            return true;
        } else {
            return false;
        }
    },

    addItemToCategory: function(categoryid, itemdata) {
        // I haven't looked at optimising this at all.
        window.console.log(this.courseformdata);
        // for (let [i, category] of this.courseformdata) {
            // if (category.id == categoryid) {
            //     this.courseformdata[i].citems = itemdata;
            // }
        // }
    },

    getCategoryItems: function(categoryid) {
        for (let category of this.courseformdata) {
            if (category.id == categoryid) {
                return category.citems
            }
        }
        return [];
    },

    addButton: function() {
        // Find area to add button. #region-main-box
        let mainregion = document.getElementById("region-main");
        let widget = this.createWidget();
        mainregion.prepend(widget);

    },

    createWidget: function() {
        // return the created widget to be appended.
        let widget = document.createElement("div");
        widget.classList.add("dropdown", "float-right");
        let button = document.createElement("button");
        button.classList.add("btn", "btn-secondary", "dropdown-toggle");
        button.setAttribute("type", "button");
        button.setAttribute("data-toggle", "dropdown");
        button.setAttribute("title", "Configure form");
        button.innerHTML = "<i class=\"icon fa fa-wrench fa-fw\" role=\"img\"></i>";
        widget.appendChild(button);

        let menucontainer = document.createElement("div");
        menucontainer.classList.add("dropdown-menu", "w-150", "mfe-menu-container");
        
        let searchform = document.createElement("div");
        searchform.classList.add("input-group", "px-2");
        let searchtextbox = document.createElement("input");
        searchtextbox.setAttribute("type", "text");
        searchtextbox.setAttribute("placeholder", "search");
        searchtextbox.classList.add("form-control");
        searchform.appendChild(searchtextbox);
        searchtextbox.addEventListener("keyup", this.filterResults.bind(this));
        menucontainer.appendChild(searchform);

        this.addCategories(this.courseformdata, menucontainer);

        widget.appendChild(menucontainer);
        return widget;
    },

    addCategories: function(data, menucontainer) {
        for (let groupitem of data) {

            let menuitems = document.createElement("a");
            menuitems.classList.add("dropdown-item", "moodle-form-item");
            menuitems.setAttribute("href", "#");
            menuitems.setAttribute("data-id", groupitem.id);
            menuitems.textContent = groupitem.title;
            menuitems.addEventListener("click", this.toggleCategory.bind(this));
            // This is not mobile accessible, but for now let's just add a key press to expand the section.
            menuitems.addEventListener("keydown", this.expandCategory.bind(this));


            if (localStorage.getItem(groupitem.id) == 'open') {
                menuitems.setAttribute("aria-current", "true");
            }

            menucontainer.appendChild(menuitems);
        }
    },

    toggleCategory: function(event) {
        event.preventDefault();
        event.stopPropagation();
        let thing = event.currentTarget.getAttribute('data-id');
        let category = document.getElementById(thing);
        if (category.classList.contains('d-none')) {
            category.classList.remove('d-none');
            localStorage.setItem(thing, 'open');
            event.currentTarget.setAttribute("aria-current", "true");
            // Need to set all category items as open as well.
            let citems = this.getCategoryItems(thing);
            for (let citem of citems) {
                let itemobject = document.getElementById(citem.id);
                itemobject.classList.remove('d-none');
                localStorage.setItem(citem.id, "open");
            }
        } else {
            category.classList.add('d-none');
            localStorage.removeItem(thing);
            event.currentTarget.removeAttribute("aria-current");
        }
    },

    toggleItem: function(event) {
        event.preventDefault();
        event.stopPropagation();
        let itemid = event.currentTarget.getAttribute('data-id');
        let citem = document.getElementById(itemid);
        if (citem.classList.contains('d-none')) {
            citem.classList.remove('d-none');
            localStorage.setItem(itemid, 'open');
        } else {
            citem.classList.add('d-none');
            localStorage.removeItem(itemid, 'open');
        }
    },

    expandCategory: function(event) {
        // The "right arrow" key has been pressed.
        let categoryid = event.currentTarget.getAttribute('data-id');
        let ourthing = document.querySelector("[data-id="+ categoryid +"");
        if (event.keyCode == "39") {
            event.preventDefault();
            event.stopPropagation();

            let citems = this.getCategoryItems(categoryid);

            let divider = document.createElement("div");
            divider.classList.add("dropdown-divider");
            divider.setAttribute("data-parent-id", categoryid);
            ourthing.parentNode.insertBefore(divider, ourthing.nextSibling);
            if (ourthing.hasAttribute("data-expanded") == false) {
                for (let citem of citems) {
                    let menuitem = document.createElement("a");
                    menuitem.classList.add("dropdown-item");
                    menuitem.setAttribute("href", "#");
                    menuitem.setAttribute("data-id", citem.id);
                    menuitem.setAttribute("data-parent-id", categoryid);
                    menuitem.setAttribute("style", "font-size: x-small");
                    menuitem.textContent = citem.title;
                    menuitem.addEventListener('click', this.toggleItem);
                    ourthing.parentNode.insertBefore(menuitem, ourthing.nextSibling);
                    ourthing.setAttribute("data-expanded", "true");
                }
            }
        }
        // The "left arrow" key has been pressed.
        if (event.keyCode == "37") {
            event.preventDefault();
            event.stopPropagation();
 
            let citems = document.querySelectorAll("[data-parent-id="+ categoryid +"");
            for (let citem of citems) {
                citem.remove();
            }
            ourthing.removeAttribute("data-expanded");
        }
    },

    filterResults: function(event) {
        let filterstring = event.currentTarget.value;
        let menucontainer = document.querySelector('.mfe-menu-container');
        let formitems = document.querySelectorAll(".moodle-form-item");
        for (let fitem of formitems) {
            fitem.remove();
        }
        // Add new results.
        if (filterstring.length > 2) {

            let temp = this.courseformdata.filter((category) => {
                categorymatches = category.title.toLowerCase().includes(filterstring.toLowerCase());
                subitemmatches = category.citems.filter(subitem => subitem.title.toLowerCase().includes(filterstring.toLowerCase())).length;
                return  categorymatches || subitemmatches;
            });
            this.addCategories(temp, menucontainer);
        } else {
            this.addCategories(this.courseformdata, menucontainer);
        }
    }
};

courseEnhancer.init();
