(($) ->
  # Contains every single Inject.ion command.
  commandDictionary =
    # Goes to the following node, carrying a value.
    # Expects 2 parameters, a node, and a value.
    inject: (values, env) ->
      node = values[0]
      value = values[1]
      console.log('inj')
      return env

    # Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
    # Expects 1 parameter, a field.
    return: (values, env) ->
      field = values[0]
      console.log('ret')
      return env

    # Sets a field in the node to the value indicated.
    # Expects 2 parameters, a field and a value.
    set: (values, env) ->
      field = values[0]
      value = values[1]
      console.log(env.store)
      return env

    # Stores a field into memory.
    # Expects 1 parameters, a field.
    store: (values, env) ->
      field = values[0]
      env.store = field
      return env

  # This represents a virtual node in the Inject.ion network.
  class Node
    constructor: (@name, @fields, @linksTo) ->

    displayName: ->
      console.log(@name)

  # This creates a rudimentary environment for the Inject.ion code.
  class InjectionRunner
    env = {
      store: 0
      line: 0
      tree: null
    }

    constructor: (@code) ->

    run: (tree) ->
      env.tree = tree
      splitLines = @code.split('\n')
      runLine(splitLines[env.line++]) while env.line < splitLines.length

    runLine = (line) ->
      lexemes = line.split(' ')
      env = commandDictionary[lexemes[0]](lexemes.slice(1), env)

  $('#injection_run').click (event) ->
    event.preventDefault()
    runner = new InjectionRunner $('#injection_code').val()
    runner.run('test')

) jQuery
