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
        // button.textContent = "Add features";
        widget.appendChild(button);

        let menucontainer = document.createElement("div");
        menucontainer.classList.add("dropdown-menu");
        
        // Insert a search form
        let searchform = document.createElement("form");
        let formdiv = document.createElement("div");
        formdiv.classList.add("form-group");
        // let 
        // Then a divider

        for (groupitem of this.courseformdata) {

            let menuitems = document.createElement("a");
            menuitems.classList.add("dropdown-item");
            menuitems.setAttribute("href", "#");
            menuitems.setAttribute("data-id", groupitem.id);
            menuitems.textContent = groupitem.title;
            menuitems.addEventListener("click", this.toggleCategory.bind(this));
            // This is not mobile accessible, but for now let's just add a key press to expand the section.
            menuitems.addEventListener("keydown", this.expandCategory.bind(this));


            if (localStorage.getItem(groupitem.id) == 'open') {
                menuitems.setAttribute("aria-current", "true");
            }

            // Let's try adding another button to get to more fine detail
            // let expand = document.createElement('button');
            // expand.textContent = "+";
            // expand.addEventListener("click", this.expandCategory);

            menucontainer.appendChild(menuitems);
            // menucontainer.appendChild(expand);
            
        }
        widget.appendChild(menucontainer);
        return widget;
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
    }
};

courseEnhancer.init();
