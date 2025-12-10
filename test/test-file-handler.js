const assert = require('assert')
const sinon = require('sinon')
const fs = require('fs')
const path = require('path')
const FileHandler = require('../build/helpers/file-handler')
const ButtonHelper = require('../build/helpers/button-helper').default
const State = require('../build/state').default

describe('FileHandler validation', function () {
  let sandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  /* ================================================================================ */
  describe('listFiles', function () {
    it('should return array of files from directory', function () {
      const mockFiles = ['file1.txt', 'file2.txt']
      sandbox.stub(fs, 'readdirSync').returns(mockFiles)

      const result = FileHandler.listFiles('/test/path')
      
      assert.deepEqual(result, mockFiles)
      sinon.assert.calledWith(fs.readdirSync, '/test/path')
    })

    it('should throw error if directory does not exist', function () {
      sandbox.stub(fs, 'readdirSync').throws(new Error('ENOENT'))

      assert.throws(() => {
        FileHandler.listFiles('/nonexistent/path')
      }, Error)
    })
  })

  /* ================================================================================ */
  describe('copyFile', function () {
    it('should return true when file copy succeeds', async function () {
      sandbox.stub(fs, 'copyFileSync').returns(undefined)

      const result = await FileHandler.copyFile('/source/file.txt', '/dest/file.txt')
      
      assert.equal(result, true)
    })

    it('should return false when file copy fails', async function () {
      sandbox.stub(fs, 'copyFileSync').throws(new Error('Copy failed'))

      const result = await FileHandler.copyFile('/source/file.txt', '/dest/file.txt')
      
      assert.equal(result, false)
    })
  })

  /* ================================================================================ */
  describe('checkFileBlank', function () {
    it('should return true for empty file', function () {
      sandbox.stub(fs, 'readFileSync').returns('')

      const result = FileHandler.checkFileBlank('/test/empty.txt')
      
      assert.equal(result, true)
    })

    it('should return true for file with only whitespace', function () {
      sandbox.stub(fs, 'readFileSync').returns('   \n\t  ')

      const result = FileHandler.checkFileBlank('/test/whitespace.txt')
      
      assert.equal(result, true)
    })

    it('should return false for file with content', function () {
      sandbox.stub(fs, 'readFileSync').returns('some content')

      const result = FileHandler.checkFileBlank('/test/content.txt')
      
      assert.equal(result, false)
    })
  })

  /* ================================================================================ */
  describe('checkFileSize', function () {
    beforeEach(function () {
      // Mock the constants
      const constants = require('../build/helpers/constants')
      sandbox.stub(constants, 'LIMIT_FILE_ENTRIES').value({ value: 'yes' })
      sandbox.stub(constants, 'FILE_ENTRY_SIZE').value({ value: '10' })
    })

    it('should return false when LIMIT_FILE_ENTRIES is not "yes"', function () {
      const constants = require('../build/helpers/constants')
      constants.LIMIT_FILE_ENTRIES.value = 'no'

      const result = FileHandler.checkFileSize('/test/file.txt')
      
      assert.equal(result, false)
    })

    it('should return true when file has more lines than limit', function () {
      const fileContent = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\nline11'
      sandbox.stub(fs, 'readFileSync').returns(fileContent)

      const result = FileHandler.checkFileSize('/test/large.txt')
      
      assert.equal(result, true)
    })

    it('should return false when file has fewer lines than limit', function () {
      const fileContent = 'line1\nline2\nline3'
      sandbox.stub(fs, 'readFileSync').returns(fileContent)

      const result = FileHandler.checkFileSize('/test/small.txt')
      
      assert.equal(result, false)
    })

    it('should handle file read errors gracefully', function () {
      sandbox.stub(fs, 'readFileSync').throws(new Error('Read error'))

      const result = FileHandler.checkFileSize('/test/error.txt')
      
      assert.equal(result, false)
    })
  })

  /* ================================================================================ */
  describe('deleteFile', function () {
    it('should return true when file exists and is deleted', function () {
      sandbox.stub(fs, 'existsSync').returns(true)
      sandbox.stub(fs, 'unlinkSync').returns(undefined)

      const result = FileHandler.deleteFile('/test/file.txt')
      
      assert.equal(result, true)
      sinon.assert.calledWith(fs.existsSync, '/test/file.txt')
      sinon.assert.calledWith(fs.unlinkSync, '/test/file.txt')
    })

    it('should return false when file does not exist', function () {
      sandbox.stub(fs, 'existsSync').returns(false)
      const unlinkStub = sandbox.stub(fs, 'unlinkSync')

      const result = FileHandler.deleteFile('/test/nonexistent.txt')
      
      assert.equal(result, false)
      sinon.assert.notCalled(unlinkStub)
    })
  })

  /* ================================================================================ */
  describe('checkFileUpload', function () {
    let mockFileService, mockButtonHelper

    beforeEach(function () {
      mockFileService = {
        setOverwriteFileType: sandbox.spy()
      }
      mockButtonHelper = { button: 'mock' }
      sandbox.stub(ButtonHelper, 'makeYesNoButton').returns(mockButtonHelper)
      sandbox.stub(FileHandler, 'checkFileBlank').returns(false)
      sandbox.stub(FileHandler, 'checkFileSize').returns(false)
      sandbox.stub(FileHandler, 'copyFile').returns(true)
      
      // Mock constants
      const constants = require('../build/helpers/constants')
      sandbox.stub(constants, 'FILE_ENTRY_SIZE').value({ value: '100' })
    })

    it('should reject non-txt files', function () {
      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.pdf',
        '/path/test.pdf',
        [],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'File: test.pdf is not the proper format. File must be a text (.txt) file')
      assert.equal(result.state, State.NONE)
      assert.equal(result.retVal, false)
    })

    it('should reject empty files', function () {
      FileHandler.checkFileBlank.restore()
      sandbox.stub(FileHandler, 'checkFileBlank').returns(true)

      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.txt',
        '/path/test.txt',
        [],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'File: test.txt is empty. Please send a list of usernames')
      assert.equal(result.state, State.NONE)
      assert.equal(result.retVal, false)
    })

    it('should reject files that are too large', function () {
      FileHandler.checkFileSize.restore()
      sandbox.stub(FileHandler, 'checkFileSize').returns(true)

      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.txt',
        '/path/test.txt',
        [],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'This user file has more than 100 entries. Please reduce the number of entries and try uploading it again.')
      assert.equal(result.state, State.NONE)
      assert.equal(result.retVal, false)
    })

    it('should prompt for overwrite when file already exists', function () {
      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.txt',
        '/path/test.txt',
        ['test.txt_users'],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'Warning : File already exists in user directory.\nIf you continue you will overwrite the file.\nReply (yes/no) to continue or cancel.')
      assert.equal(result.state, State.OVERWRITE_CHECK)
      assert.deepEqual(result.messagemeta, mockButtonHelper)
      assert.equal(result.retVal, false)
      sinon.assert.calledWith(mockFileService.setOverwriteFileType, '_users')
    })

    it('should successfully upload new file', function () {
      sandbox.stub(process, 'cwd').returns('/app')

      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.txt',
        '/path/test.txt',
        [],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'File named: test.txt successfully saved to directory.')
      assert.equal(result.state, State.NONE)
      assert.equal(result.retVal, true)
      sinon.assert.calledWith(FileHandler.copyFile, '/path/test.txt', '/app/files/user@test.com/test.txt_users')
    })

    it('should handle copy file failure', function () {
      FileHandler.copyFile.restore()
      sandbox.stub(FileHandler, 'copyFile').returns(false)
      sandbox.stub(process, 'cwd').returns('/app')

      const result = FileHandler.checkFileUpload(
        mockFileService,
        'test.txt',
        '/path/test.txt',
        [],
        '_users',
        'user@test.com'
      )

      assert.equal(result.reply, 'Error: File named: test.txt not saved to directory.')
      assert.equal(result.state, State.NONE)
      assert.equal(result.retVal, false)
    })
  })
})