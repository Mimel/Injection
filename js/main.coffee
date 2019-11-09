(($) ->
  commandDictionary =
    # Goes to the following node, carrying a value.
    # Expects 2 parameters, a node, and a value.
    inject: (values) ->
      node = values[0]
      value = values[1]
      console.log('inj')

    # Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
    # Expects 1 parameter, a field.
    return: (values) ->
      field = values[0]
      console.log('ret')

    # Sets a field in the node to the value indicated.
    # Expects 2 parameters, a field and a value.
    set: (values) ->
      field = values[0]
      value = values[1]
      console.log('set')

    # Stores a field into memory.
    # Expects 1 parameters, a field.
    store: (values) ->
      field = values[0]
      console.log('ste')

  class Node
    constructor: (@name, @fields, @linksTo) ->

    displayName: ->
      console.log(@name)

  class InjectionRunner
    store = 0
    constructor: (@code) ->

    run: (tree) ->
      splitLines = @code.split('\n')
      runLine line for line in splitLines

    runLine = (line) ->
      lexemes = line.split(' ')
      commandDictionary[lexemes[0]] -> lexemes.slice(1)

  $('#injection_run').click (event) ->
    event.preventDefault()
    runner = new InjectionRunner $('#injection_code').val()
    runner.run('test')

) jQuery
