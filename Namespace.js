/*
* A simple library to help you organize your Node.js/Electron app in terms of namespaces and classes.
*
* https://github.com/serybva/Namespace.js
*
* Author Sébastien Vray <sebastien@serybva.com>
*
* Copyright (c) 2016 Sébastien Vray <sebastien@serybva.com> https://github.com/serybva
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without
* limitation the rights to use, copy, modify, merge, publish, distribute,
* sublicense, and/or sell copies of the Software,
* and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
* INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
* PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/

'use strict';

const pathModule = require('path');

class       Namespace {

    __constructor() {
    }

    static getInstance() {
        var instance = null;

        var NamespaceObject = function(name) {
            this.name = name;
            this.classes = [];
            this.children = [];
            this.parent = null;
            if (arguments.length > 1) {
                this.parent = arguments[1];
            }
            this.loader = null;
        };

        NamespaceObject.prototype = {
            addChild: function(name) {
                var exists = this.getChild(name);

                if (!exists) {
                    exists = new NamespaceObject(name, this);
                    this.children.push(exists);
                }
                return exists;
            },
            getChild: function(name) {
                var matchingChild = null;

                this.children.forEach(function(child) {
                    if (child.getName() === name) {
                        matchingChild = child;
                        return child;
                    }
                });
                return matchingChild;
            },
            getName: function() {
                return this.name;
            },
            getParent: function() {
                return this.parent;
            },
            addClass: function(name, location) {
                var exists = this.getClass(name);
                if (!exists) {
                    exists = {
                        'name': name,
                        'location': location
                    };
                    this.classes.push(exists);
                }
                return this;
            },
            getClass: function(name) {
                var matchingClass = null;

                this.classes.forEach(function(_class) {
                    if (_class.name === name) {
                        matchingClass = _class;
                        return _class;
                    }
                });
                return matchingClass;
            },
            setLoader: function(callback) {
                this.loader = callback;
            },
            require: function(className) {
                if (this.loader === null) {
                    var segments = [this.name];
                    var current = this;
                    var path = '';

                    while ((current = current.getParent()) !== null) {
                        if (current.name.length > 0) {
                            segments.unshift(current.name);
                        }
                    }
                    segments.unshift(process.cwd());
                    segments.push(className+'.js');
                    path = pathModule.resolve.apply({}, segments);
                    return require(path);
                } else {
                    return require(this.loader(this, className));
                }
            }
        };

        var constructor = function() {
            this.root = new NamespaceObject('');
            if (this.instance === null) {
                return new this();
            }
            return instance;
        };

        constructor.prototype = {
            define:  function(namespace) {
                if (typeof namespace === 'string' && namespace.length > 0) {
                    var path = namespace.split('\\');
                    var current = this.root;

                    //Loop on each namespace level
                    path.forEach(function(level) {
                        //If the namespace level does not exists
                        if (current.getChild(level) === null) {
                            current = current.addChild(level);
                        }
                    }.bind(this));
                    return current;
                } else {
                    throw "Namespace name must be a non-empty string";
                }
            },
            use:  function(namespace) {
                if (typeof namespace === 'string' && namespace.length > 0) {
                    var path = namespace.split('\\');
                    var current = this.root;

                    //Loop on each namespace level
                    path.forEach(function(level) {
                        current = current.getChild(level);
                        //If the namespace level does not exists
                        if (current === null) {
                            throw "Namespace "+namespace+" not found !"
                        }
                    });
                    return current;
                } else {
                    throw "Namespace name must be a non-empty string";
                }
            }
        };
        if (Namespace.instance === undefined) {
            Namespace.instance = new constructor();
        }
        return Namespace.instance;
    }

    static  define() {
        var instance = Namespace.getInstance();
        return instance.define.apply(instance, arguments);
    }

    static  use() {
        var instance = Namespace.getInstance();
        return instance.use.apply(instance, arguments);
    }

    static  setLoader(loader) {
        var instance = Namespace.getInstance();
        return instance.use.apply(instance, arguments);
    }
}

module.exports = Namespace;
