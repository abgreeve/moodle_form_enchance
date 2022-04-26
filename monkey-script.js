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

    /**
     * Builds up an array of information about the form on the page. Then adds the menu button for form configuration.
     */
    init: function() {
        this.buildData();
        // window.console.log(this.courseformdata);
        this.addButton();
    },

    /**
     * Builds up courseformdata with information about the form, both categories and form elements.
     */
    buildData: function() {
        this.courseformdata = [];
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

    /**
     * Builds category items.
     *
     * @param      {<type>}  category A category node that contains form elements
     * @return     {array} The category items.
     */
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

    /**
     * Gets the category items in the courseformdata from a category id
     *
     * @param {int} categoryid  The categoryid
     * @return {Array} The category items.
     */
    getCategoryItems: function(categoryid) {
        for (let category of this.courseformdata) {
            if (category.id == categoryid) {
                return category.citems
            }
        }
        return [];
    },

    /**
     * Adds a dropdown menu to customise the form.
     */
    addButton: function() {
        // Find area to add button. #region-main-box
        let mainregion = document.getElementById("region-main");
        let widget = this.createWidget();
        mainregion.prepend(widget);

    },

    /**
     * Creates the majority of the elements for the dropdown menu
     *
     * @return {<type>}  dropdown menu html
     */
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

    /**
     * Adds categories.
     *
     * @param {array} an array of container and item information in the format of courseformdata.
     * @param {htmlelement}  menucontainer  The menucontainer with the data added as dropdown menu elements.
     */
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
            // lets try and click the expand event.
            let tester = category.querySelector('.icons-collapse-expand');
            if (tester.getAttribute('aria-expanded') == "false") {
                tester.click();
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
        let parentid = event.currentTarget.getAttribute('data-parent-id');
        // Force open category if not done yet.
        this.enableCategory(parentid);
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
                    menuitem.addEventListener('click', this.toggleItem.bind(this));
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

    addFilteredCategories: function(list, container) {
        for (let groupitem of list) {

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

            container.appendChild(menuitems);
            this.openCategory(groupitem.id, menuitems);
        }
    },

    openCategory: function(categoryid, categorynode) {
        let citems = this.getCategoryItems(categoryid);

        let divider = document.createElement("div");
        divider.classList.add("dropdown-divider");
        divider.setAttribute("data-parent-id", categoryid);
        categorynode.parentNode.insertBefore(divider, categorynode.nextSibling);
        if (categorynode.hasAttribute("data-expanded") == false) {
            for (let citem of citems) {
                let menuitem = document.createElement("a");
                menuitem.classList.add("dropdown-item");
                menuitem.setAttribute("href", "#");
                menuitem.setAttribute("data-id", citem.id);
                menuitem.setAttribute("data-parent-id", categoryid);
                menuitem.setAttribute("style", "font-size: x-small");
                menuitem.textContent = citem.title;
                menuitem.addEventListener('click', this.toggleItem.bind(this));
                categorynode.parentNode.insertBefore(menuitem, categorynode.nextSibling);
                categorynode.setAttribute("data-expanded", "true");
            }
        }
    },

    closeCategories: function() {
        for (let category of this.courseformdata) {

            let categorynode = document.querySelector("[data-id="+ category.id +"");
            let citems = document.querySelectorAll("[data-parent-id="+ category.id +"");
            for (let citem of citems) {
                citem.remove();
            }
            // categorynode.removeAttribute("data-expanded");
        }
    },

    /**
     * This makes an already expanded category active.
     *
     * @param      {<type>}  categoryid  The categoryid
     */
    enableCategory: function(categoryid) {
        let category = document.querySelector("[data-id=" + categoryid + "");
        if (category.hasAttribute('aria-current') == false) {
            category.setAttribute('aria-current', 'true');
            let categoryformitem = document.getElementById(categoryid);
            categoryformitem.classList.remove('d-none');
            localStorage.setItem(categoryid, 'open');
            categoryformitem.setAttribute('aria-current', "true");
            let tester = categoryformitem.querySelector('.icons-collapse-expand');
            if (tester.getAttribute('aria-expanded') == "false") {
                tester.click();
            }
        }
    },

    filterResults: function(event) {
        let filterstring = event.currentTarget.value;
        let menucontainer = document.querySelector('.mfe-menu-container');
        let formitems = document.querySelectorAll(".moodle-form-item");
        for (let fitem of formitems) {
            fitem.remove();
        }

        // Always need to collapse categories.
        this.closeCategories();
        // Reset core data as well here?
        this.buildData();

        // Add new results.
        if (filterstring.length > 2) {

            let supertmep = [];

            let temp = this.courseformdata.filter((category) => {
                categorymatches = category.title.toLowerCase().includes(filterstring.toLowerCase());
                subitemmatches = category.citems.filter(subitem => subitem.title.toLowerCase().includes(filterstring.toLowerCase()));
                supertmep.push(subitemmatches);
                return  categorymatches || subitemmatches.length;
            });

            let newtemp = temp.map((category) => {
                category.citems = [];
                return category;
            });

            for (let key in supertmep) {
                if (supertmep[key].length > 0) {
                    let awesomelist = newtemp.map((category) => {
                        if (category.id == this.courseformdata[key].id) {
                            category.citems = supertmep[key];
                        }
                        return category;
                    });
                    newtemp = awesomelist;
                }
            }
            // Let's replace this with a new method that can be improved later.
            this.addFilteredCategories(temp, menucontainer);
        } else {
            this.addCategories(this.courseformdata, menucontainer);
        }
    }
};

courseEnhancer.init();
