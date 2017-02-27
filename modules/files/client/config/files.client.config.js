'use strict';

// Configuring the files module
angular.module('files').run(['Menus',
  function (Menus) {
    // Add the files dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Files',
      state: 'files',
      type: 'dropdown',
      roles: ['user']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'files', {
      title: 'List Files',
      state: 'files.list',
      roles: ['user']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'files', {
      title: 'Create Files',
      state: 'files.create',
      roles: ['user']
    });
  }
]);
